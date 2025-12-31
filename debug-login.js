// Debug login issue
require('dotenv').config();
const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function debugLogin() {
    console.log('Debugging login issue...\n');
    
    try {
        // Check if user exists
        console.log('1. Checking if student1 exists...');
        const userResult = await pool.query(
            'SELECT id, username, email, password_hash, role FROM users WHERE username = $1 OR email = $1',
            ['student1']
        );
        
        if (userResult.rows.length === 0) {
            console.log('   ✗ User student1 NOT found in database!');
            console.log('   Run: npm run seed');
            return;
        }
        
        console.log('   ✓ User found:', userResult.rows[0].username);
        console.log('   Role:', userResult.rows[0].role);
        console.log('   Password hash:', userResult.rows[0].password_hash.substring(0, 20) + '...');
        
        // Test password
        console.log('\n2. Testing password...');
        const isValid = await bcrypt.compare('password123', userResult.rows[0].password_hash);
        console.log('   Password match:', isValid ? '✓ YES' : '✗ NO');
        
        if (!isValid) {
            console.log('   ✗ Password does not match!');
            console.log('   The password hash might be incorrect.');
        } else {
            console.log('   ✓ Password is correct!');
        }
        
        // Test database connection
        console.log('\n3. Testing database query...');
        const testQuery = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log('   Total users in database:', testQuery.rows[0].count);
        
    } catch (error) {
        console.log('   ✗ Error:', error.message);
        console.log('   Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

debugLogin();

