# Fix Login Issue - Step by Step Guide

## Problem
Login is not working - no errors shown, but nothing happens.

## Root Causes Found & Fixed

### ✅ Fixed Issues:
1. **CORS Configuration** - Updated to allow requests from localhost:3000
2. **JWT_SECRET Check** - Added validation for missing JWT_SECRET

## Steps to Fix

### Step 1: Stop Current Server
If the server is running, press `Ctrl+C` in the terminal to stop it.

### Step 2: Verify .env File
Make sure your `.env` file has:
```
JWT_SECRET=some_random_secret_string_here
```
(It should NOT be "change_this" or empty)

### Step 3: Restart Server
```powershell
npm start
```

### Step 4: Test Login
1. Open browser: http://localhost:3000
2. Try login with:
   - Username: `student1`
   - Password: `password123`

## Debugging Steps

### Check Browser Console
1. Open browser (F12 or Right-click → Inspect)
2. Go to "Console" tab
3. Try to login
4. Look for any error messages

### Check Network Tab
1. Open browser DevTools (F12)
2. Go to "Network" tab
3. Try to login
4. Look for the `/api/auth/login` request
5. Check:
   - Status code (should be 200)
   - Response (should have token)
   - Request payload (username/password sent)

### Test API Directly
Run this to test the API:
```powershell
node test-login.js
```

## Common Issues

### Issue: "CORS error" in browser console
**Solution:** Already fixed in server.js - restart server

### Issue: "JWT_SECRET is not set"
**Solution:** Add JWT_SECRET to .env file

### Issue: "Network error" or "Failed to fetch"
**Solution:** 
- Check if server is running: `http://localhost:3000/api/health`
- Check browser console for CORS errors

### Issue: Login form does nothing
**Solution:**
- Check browser console for JavaScript errors
- Verify API_BASE_URL in index.html matches server port
- Check if server is actually running

## Quick Test

Run this command to test everything:
```powershell
node test-login.js
```

If this works but browser doesn't, it's a frontend/CORS issue.
If this doesn't work, it's a backend/database issue.

## Still Not Working?

1. **Check server logs** - Look at the terminal where `npm start` is running
2. **Check browser console** - F12 → Console tab
3. **Verify database** - Run: `node debug-login.js`
4. **Test API directly** - Run: `node test-login.js`

Let me know what errors you see!

