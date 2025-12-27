// Test login functionality
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

async function testLogin() {
    console.log('Testing login functionality...\n');
    
    // Test 1: Check if server is running
    console.log('1. Checking server health...');
    try {
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            console.log('   ✓ Server is running');
            console.log('   Response:', health);
        } else {
            console.log('   ✗ Server returned error:', healthResponse.status);
        }
    } catch (error) {
        console.log('   ✗ Server is NOT running or not accessible');
        console.log('   Error:', error.message);
        console.log('\n   Please make sure the server is running: npm start');
        process.exit(1);
    }
    
    console.log('');
    
    // Test 2: Test login
    console.log('2. Testing login with student1...');
    try {
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'student1',
                password: 'password123'
            })
        });
        
        const loginData = await loginResponse.json();
        
        if (loginResponse.ok) {
            console.log('   ✓ Login successful!');
            console.log('   User:', loginData.user.username, '- Role:', loginData.user.role);
            console.log('   Token received:', loginData.token.substring(0, 20) + '...');
        } else {
            console.log('   ✗ Login failed');
            console.log('   Error:', loginData.message || loginData);
        }
    } catch (error) {
        console.log('   ✗ Login request failed');
        console.log('   Error:', error.message);
    }
    
    console.log('');
    console.log('Test complete!');
}

testLogin();

