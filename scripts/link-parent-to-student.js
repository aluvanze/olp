require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function main() {
  const schoolId = process.argv[2];
  const parentEmail = process.argv[3];
  const parentName = process.argv[4] || '';

  if (!schoolId || !parentEmail) {
    console.error('Usage: node scripts/link-parent-to-student.js <school_id> <parent_email> [parent_name]');
    process.exit(1);
  }

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const learnerResult = await client.query(
      'SELECT id, user_id, parent_id FROM learner_profiles WHERE admission_number = $1',
      [schoolId]
    );
    if (learnerResult.rows.length === 0) throw new Error(`Learner not found for School ID ${schoolId}`);
    const learner = learnerResult.rows[0];

    const email = String(parentEmail).trim();
    let parentId = null;
    let createdCreds = null;

    const existingByEmail = await client.query('SELECT id, role, username FROM users WHERE email = $1', [email]);
    if (existingByEmail.rows.length > 0) {
      const ex = existingByEmail.rows[0];
      if (ex.role !== 'parent') throw new Error('Parent email is already used by a non-parent account.');
      parentId = ex.id;
    } else {
      const tempPassword = '123456.ab';
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const base = 'parent_' + email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = base || 'parent';
      let ps = 0;
      let uCheck = await client.query('SELECT id FROM users WHERE username = $1', [username]);
      while (uCheck.rows.length > 0) {
        ps++;
        username = base + ps;
        uCheck = await client.query('SELECT id FROM users WHERE username = $1', [username]);
      }
      const pFirst = parentName ? parentName.split(' ')[0] : 'Parent';
      const pLast = parentName ? parentName.split(' ').slice(1).join(' ') : '';
      const parentResult = await client.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, 'parent', true)
         RETURNING id`,
        [username, email, passwordHash, pFirst, pLast]
      );
      parentId = parentResult.rows[0].id;
      createdCreds = { username, temp_password: tempPassword };
    }

    await client.query('UPDATE learner_profiles SET parent_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [parentId, learner.id]);
    await client.query('COMMIT');

    console.log(JSON.stringify({
      ok: true,
      school_id: schoolId,
      learner_id: learner.id,
      parent_id: parentId,
      ...(createdCreds ? { parent_credentials: createdCreds } : {})
    }, null, 2));
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Link parent failed:', e.message || e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

