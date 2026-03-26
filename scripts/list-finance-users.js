require('dotenv').config();
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
    const result = await pool.query(
      `SELECT username, email, first_name, last_name, is_active
       FROM users
       WHERE role = 'finance'
       ORDER BY id`
    );
    console.log(JSON.stringify(result.rows, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error('Failed:', e.message || e);
  process.exit(1);
});

