# Test Database Connection from Hosting Platform

## Problem
`psql` command not found on hosting platform.

## Solution: Use Node.js to Test Connection

Since you have Node.js on your hosting platform, use a Node.js script to test the connection.

---

## Step 1: Upload Test Script

I've created `test-db-connection-hosting.js` for you.

**Upload this file to your hosting platform** (same directory as your project).

---

## Step 2: Run the Test

On your hosting platform:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Run the test
node test-db-connection-hosting.js
```

---

## Step 3: Interpret Results

### ✅ If Connection Successful:
```
✅ CONNECTION SUCCESSFUL!
Database: grade10_lms
User: grade10_user
Users in database: X
```

**This means:** Database connection is working! The issue is elsewhere.

---

### ❌ If Connection Failed:

The script will show the exact error:

#### Error: `password authentication failed` (Code: 28P01)
**Problem:** Wrong password  
**Fix:** Update VPS database password to match hosting platform

#### Error: `database does not exist` (Code: 3D000)
**Problem:** Wrong database name  
**Fix:** Check `DB_NAME=grade10_lms` is correct

#### Error: `ECONNREFUSED` or `ETIMEDOUT`
**Problem:** Can't connect to VPS  
**Fix:** 
1. Check PostgreSQL is running on VPS
2. Check PostgreSQL is configured for remote access
3. Check firewall allows port 5432

---

## Alternative: Check Server Logs

If you can't run the test script, check your server logs when you try to login.

**On your hosting platform:**
1. Go to logs/console
2. Try to login
3. Look for database connection errors

---

## Quick Fixes Based on Error

### If "password authentication failed":
On VPS:
```bash
sudo -u postgres psql
ALTER USER grade10_user WITH PASSWORD 'YourSecurePassword123!';
\q
```

### If "database does not exist":
On VPS:
```bash
sudo -u postgres psql
CREATE DATABASE grade10_lms OWNER grade10_user;
\q
```

### If "connection refused":
On VPS:
1. Configure PostgreSQL for remote access
2. Allow firewall port 5432
3. Restart PostgreSQL

---

## Summary

**Since psql isn't available, use Node.js to test:**

1. Upload `test-db-connection-hosting.js` to hosting
2. Run: `node test-db-connection-hosting.js`
3. See the exact error
4. Fix based on the error

**This will tell you exactly what's wrong!** 🔍












