require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function ensureEnumValues(pool) {
  const values = ['sub_county_office', 'county_office', 'national_office'];
  for (const v of values) {
    try {
      // ALTER TYPE ADD VALUE cannot be safely parameterized
      // and may fail if value exists; ignore duplicate_object
      // eslint-disable-next-line no-await-in-loop
      await pool.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS '${v}'`);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    await ensureEnumValues(pool);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS school_tags (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        tag_type VARCHAR(50) NOT NULL,
        tag_value VARCHAR(100) NOT NULL,
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(school_id, tag_type, tag_value)
      );
    `);

    const tempPassword = '123456.ab';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const users = [
      { username: 'subcounty_office_1', email: 'subcounty.office@olp.local', first_name: 'Sub-County', last_name: 'Office', role: 'sub_county_office' },
      { username: 'county_office_1', email: 'county.office@olp.local', first_name: 'County', last_name: 'Office', role: 'county_office' },
      { username: 'national_office_1', email: 'national.office@olp.local', first_name: 'National', last_name: 'Office', role: 'national_office' }
    ];

    for (const u of users) {
      // eslint-disable-next-line no-await-in-loop
      await pool.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (email)
         DO UPDATE SET role = EXCLUDED.role, is_active = true, updated_at = CURRENT_TIMESTAMP`,
        [u.username, u.email, passwordHash, u.first_name, u.last_name, u.role]
      );
    }

    const check = await pool.query(
      `SELECT email, username, role, is_active
       FROM users
       WHERE email IN ($1, $2, $3)
       ORDER BY email`,
      ['subcounty.office@olp.local', 'county.office@olp.local', 'national.office@olp.local']
    );

    console.log(JSON.stringify({ ok: true, temp_password: tempPassword, users: check.rows }, null, 2));
  } catch (e) {
    console.error('Create office users failed:', e.message || e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

