require('dotenv').config();
const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function seedSubjects() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Read and execute the SQL migration
    const sql = fs.readFileSync(path.join(__dirname, 'migrations/005_seed_senior_school_subjects.sql'), 'utf8');
    await client.query(sql);
    
    await client.query('COMMIT');
    
    console.log('✅ Senior School subjects seeded successfully!');
    console.log('');
    console.log('Subjects created:');
    console.log('  - 4 Core subjects (English, Kiswahili, Mathematics, CSL)');
    console.log('  - 4 Arts & Sports Science subjects');
    console.log('  - 14 Social Sciences subjects');
    console.log('  - 15 STEM subjects');
    console.log('  - 3 Additional subjects (PE, ICT, P/RPI)');
    console.log('');
    console.log('Total: 40 learning areas/subjects');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding subjects:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedSubjects();

