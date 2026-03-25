const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

function isEnumAlterSql(sql) {
  // Postgres enum ADD VALUE has transactional limitations and is best run outside explicit BEGIN/COMMIT.
  // We treat any migration containing ALTER TYPE ... ADD VALUE as "enum migration".
  return /ALTER\s+TYPE\b[\s\S]*\bADD\s+VALUE\b/i.test(sql);
}

async function ensureSchemaMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedSet() {
  const r = await pool.query('SELECT filename FROM schema_migrations');
  return new Set((r.rows || []).map(x => x.filename));
}

async function tableExists(tableName) {
  const r = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    [tableName]
  );
  return !!r.rows?.[0]?.exists;
}

async function recordApplied(filename) {
  await pool.query(
    `INSERT INTO schema_migrations (filename)
     VALUES ($1)
     ON CONFLICT (filename) DO NOTHING`,
    [filename]
  );
}

async function runMigrations() {
  await ensureSchemaMigrationsTable();
  const applied = await getAppliedSet();

  // If this is an existing DB, baseline the initial schema migration to avoid failing on CREATE TYPE/TABLE.
  // (If DB is empty, we will apply 001 normally.)
  if (!applied.has('001_initial_schema.sql')) {
    const usersExists = await tableExists('users');
    if (usersExists) {
      console.log('Detected existing database (users table exists). Baseline: marking 001_initial_schema.sql as applied.');
      await recordApplied('001_initial_schema.sql');
      applied.add('001_initial_schema.sql');
    }
  }
  
  try {
    // Read and execute migration files in order
    const migrationDir = path.join(__dirname);
    const files = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql') && !file.includes('backup'))
      .sort();
    
    console.log('Running migrations...');
    
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`↷ Skipping ${file} (already applied)`);
        continue;
      }
      console.log(`Executing ${file}...`);
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');

      if (isEnumAlterSql(sql)) {
        // Run outside explicit transaction
        await pool.query(sql);
        await recordApplied(file);
        applied.add(file);
        console.log(`✓ ${file} completed (enum-safe mode)`);
        continue;
      }

      // Run each migration in its own transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        await recordApplied(file);
        applied.add(file);
        console.log(`✓ ${file} completed`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    
    console.log('All migrations completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runMigrations()
  .then(() => {
    console.log('Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting up database:', error);
    process.exit(1);
  });

