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

  const out = (label, value) => {
    process.stdout.write(`\n=== ${label} ===\n`);
    process.stdout.write(typeof value === 'string' ? value + '\n' : JSON.stringify(value, null, 2) + '\n');
  };

  try {
    const cols = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'learner_profiles'
       ORDER BY ordinal_position`
    );
    out('learner_profiles columns', cols.rows);

    const colsUsers = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'users'
       ORDER BY ordinal_position`
    );
    out('users columns (truncated)', colsUsers.rows.filter(r => ['id', 'username', 'email', 'role', 'is_active', 'is_verified'].includes(r.column_name)));

    const recentLearners = await pool.query(
      `SELECT lp.id AS learner_id,
              lp.admission_number AS school_id,
              lp.parent_id,
              lp.created_at,
              su.id AS student_user_id,
              su.first_name AS student_first_name,
              su.last_name AS student_last_name,
              su.email AS student_email,
              pu.username AS parent_username,
              pu.email AS parent_email,
              pu.role AS parent_role,
              pu.is_active AS parent_is_active
       FROM learner_profiles lp
       INNER JOIN users su ON su.id = lp.user_id
       LEFT JOIN users pu ON pu.id = lp.parent_id
       ORDER BY lp.created_at DESC
       LIMIT 10`
    );
    out('recent learner_profiles (with parent join)', recentLearners.rows);

    const recentParents = await pool.query(
      `SELECT id, username, email, first_name, last_name, is_active, is_verified, created_at
       FROM users
       WHERE role = 'parent'
       ORDER BY created_at DESC
       LIMIT 10`
    );
    out('recent parent users', recentParents.rows);

    out('next step', 'If the student row has parent_id=NULL, it means the parent email did not get saved/linked. If parent_id is set, use parent_email/parent_username shown above to log in (password: 123456.ab for newly created parents).');
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error('diagnose-parent-link failed:', e);
  process.exit(1);
});

