# How to Test the Login Endpoint

## Endpoint Details

- **URL:** `http://localhost:3000/api/auth/login`
- **Method:** POST (not GET - can't open in browser directly)
- **Content-Type:** application/json

---

## Step 1: Make Sure Server is Running

### Check if server is running:

```powershell
# In PowerShell
Get-Process -Name node -ErrorAction SilentlyContinue
```

Or check if port 3000 is in use:
```powershell
netstat -ano | findstr :3000
```

### Start the server if not running:

```powershell
cd C:\Users\JAKE\Documents\olp
npm start
```

You should see:
```
Senior School OLP Server running on port 3000
Environment: development
Database connected successfully
```

---

## Step 2: Test the Endpoint

### Option 1: Using PowerShell (curl)

```powershell
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"student1\",\"password\":\"password123\"}'
```

### Option 2: Using Browser (GET health check first)

1. **Test if server is running:**
   - Open browser: http://localhost:3000/api/health
   - Should return: `{"status":"ok","message":"Senior School OLP API is running"}`

2. **For POST requests, use browser DevTools:**
   - Open browser: http://localhost:3000
   - Press F12 → Console tab
   - Run this:
   ```javascript
   fetch('http://localhost:3000/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ username: 'student1', password: 'password123' })
   })
   .then(r => r.json())
   .then(console.log)
   .catch(console.error)
   ```

### Option 3: Using Postman or Insomnia

1. **Method:** POST
2. **URL:** `http://localhost:3000/api/auth/login`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "username": "student1",
     "password": "password123"
   }
   ```

### Option 4: Create a Test Script

Create a file `test-login.js`:

```javascript
const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'student1',
        password: 'password123'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
```

Run it:
```powershell
node test-login.js
```

---

## Expected Response

### Success Response (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "student1",
    "email": "student1@school.com",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe"
  },
  "requires_grade_selection": true,
  "available_grades": [...]
}
```

### Error Response (401):
```json
{
  "message": "Invalid username or password"
}
```

---

## Default Test Users

After running `npm run seed`, you can use:

| Username | Password | Role |
|----------|----------|------|
| `headteacher` | `password123` | headteacher |
| `deputy` | `password123` | deputy_headteacher |
| `finance` | `password123` | finance |
| `teacher1` | `password123` | teacher |
| `student1` | `password123` | student |
| `parent1` | `password123` | parent |

---

## Troubleshooting

### Error: "Cannot GET /api/auth/login"
- **Cause:** Trying to use GET instead of POST
- **Fix:** Use POST method

### Error: "Connection refused" or "ECONNREFUSED"
- **Cause:** Server is not running
- **Fix:** Start server with `npm start`

### Error: "Database connection error"
- **Cause:** Database not connected
- **Fix:** Check `.env` file has correct database credentials

### Error: "JWT_SECRET is not set"
- **Cause:** Missing JWT_SECRET in `.env`
- **Fix:** Add `JWT_SECRET=your_secret_here` to `.env`

---

## Quick Test Command

**PowerShell:**
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"username":"student1","password":"password123"}'
```

**Or using curl (if installed):**
```powershell
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"student1\",\"password\":\"password123\"}"
```

---

## Summary

1. ✅ Start server: `npm start`
2. ✅ Test health: http://localhost:3000/api/health (in browser)
3. ✅ Test login: Use POST request (PowerShell, Postman, or browser console)
4. ✅ Check response for token and user data

**The endpoint is working if you get a token back!** 🎉












