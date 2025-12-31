const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Read and execute migration files in order
    const migrationDir = path.join(__dirname);
    const files = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log('Running migrations...');
    
    for (const file of files) {
      console.log(`Executing ${file}...`);
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      await client.query(sql);
      console.log(`✓ ${file} completed`);
    }
    
    await client.query('COMMIT');
    console.log('All migrations completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
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

