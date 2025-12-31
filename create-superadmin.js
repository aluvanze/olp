require('dotenv').config();
const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function createSuperadmin() {
  try {
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // Check if superadmin already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      ['superadmin']
    );
    
    if (existing.rows.length > 0) {
      // Update existing user to superadmin
      await pool.query(
        'UPDATE users SET role = $1, password_hash = $2 WHERE username = $3',
        ['superadmin', passwordHash, 'superadmin']
      );
      console.log('Superadmin updated!');
    } else {
      // Create new superadmin
      await pool.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['superadmin', 'superadmin@school.com', passwordHash, 'Super', 'Admin', 'superadmin']
      );
      console.log('Superadmin created!');
    }
    
    console.log('');
    console.log('Superadmin credentials:');
    console.log('  Username: superadmin');
    console.log('  Password: admin123');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createSuperadmin();

