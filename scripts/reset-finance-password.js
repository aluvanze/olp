require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    const hash = await bcrypt.hash('123456.ab', 10);
    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE role = 'finance' AND username = 'finance'
       RETURNING username, email, is_active`,
      [hash]
    );
    console.log(JSON.stringify({ updated: result.rowCount, user: result.rows[0] || null }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error('Failed:', e.message || e);
  process.exit(1);
});

