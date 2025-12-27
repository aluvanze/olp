// Test database connection script
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'grade10_lms',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

console.log('Testing database connection...');
console.log('Host:', process.env.DB_HOST || 'localhost');
console.log('Port:', process.env.DB_PORT || 5432);
console.log('Database:', process.env.DB_NAME || 'grade10_lms');
console.log('User:', process.env.DB_USER || 'postgres');
console.log('Password:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-2) : 'NOT SET');
console.log('');

pool.connect()
  .then(client => {
    console.log('✅ SUCCESS! Database connection works!');
    console.log('Your .env password is correct.');
    client.release();
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ ERROR: Database connection failed!');
    console.log('');
    console.log('Error:', err.message);
    console.log('');
    console.log('Possible issues:');
    console.log('1. DB_PASSWORD in .env file is incorrect');
    console.log('2. PostgreSQL service is not running');
    console.log('3. Database "grade10_lms" does not exist');
    console.log('');
    console.log('To fix:');
    console.log('1. Open .env file');
    console.log('2. Update DB_PASSWORD with your PostgreSQL password');
    console.log('3. Make sure PostgreSQL service is running');
    console.log('4. Make sure database exists: psql -U postgres -c "CREATE DATABASE grade10_lms;"');
    process.exit(1);
  });

