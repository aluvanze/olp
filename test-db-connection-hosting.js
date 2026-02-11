// Test Database Connection from Hosting Platform
// Run this on your hosting platform to test connection to VPS database

require('dotenv').config();
const { Pool } = require('pg');

console.log('Testing database connection...');
console.log('==============================');

// Show what we're trying to connect to (without password)
console.log('Connection settings:');
console.log('  DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('  DB_PORT:', process.env.DB_PORT || 'NOT SET');
console.log('  DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('  DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');
console.log('');

const pool = new Pool({
  host: process.env.DB_HOST || '72.60.23.73',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'grade10_lms',
  user: process.env.DB_USER || 'grade10_user',
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 5000,
});

pool.query('SELECT NOW() as current_time, current_database() as database_name, current_user as user_name', (err, res) => {
  if (err) {
    console.error('❌ CONNECTION FAILED!');
    console.error('==============================');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    console.error('');
    console.error('Possible causes:');
    
    if (err.code === '28P01') {
      console.error('  → Password authentication failed');
      console.error('  → Check DB_PASSWORD matches VPS database password');
    } else if (err.code === '3D000') {
      console.error('  → Database does not exist');
      console.error('  → Check DB_NAME is correct (should be: grade10_lms)');
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      console.error('  → Cannot connect to database server');
      console.error('  → Check:');
      console.error('    1. PostgreSQL is running on VPS');
      console.error('    2. PostgreSQL is configured for remote access');
      console.error('    3. Firewall allows port 5432');
      console.error('    4. DB_HOST is correct (72.60.23.73)');
    } else {
      console.error('  → Check server logs for more details');
    }
    
    process.exit(1);
  } else {
    console.log('✅ CONNECTION SUCCESSFUL!');
    console.log('==============================');
    console.log('Current time:', res.rows[0].current_time);
    console.log('Database:', res.rows[0].database_name);
    console.log('User:', res.rows[0].user_name);
    console.log('');
    console.log('Database connection is working! ✅');
    
    // Test if users table exists
    pool.query('SELECT COUNT(*) as user_count FROM users', (err, res) => {
      if (err) {
        console.log('⚠️  Warning: Could not query users table:', err.message);
      } else {
        console.log('Users in database:', res.rows[0].user_count);
      }
      pool.end();
      process.exit(0);
    });
  }
});












