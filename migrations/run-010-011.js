const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function run() {
  const client = await pool.connect();
  try {
    for (const file of ['010_add_grades_system.sql', '011_add_student_guardian_grade.sql']) {
      const filepath = path.join(__dirname, file);
      if (!fs.existsSync(filepath)) {
        console.log('Skipping ' + file + ' (not found)');
        continue;
      }
      console.log('Executing ' + file + '...');
      const sql = fs.readFileSync(filepath, 'utf8');
      await client.query(sql);
      console.log('Done: ' + file);
    }
    console.log('Migrations 010 and 011 completed.');
  } catch (err) {
    console.error('Error:', err.message);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
}

run().catch(() => process.exit(1));
