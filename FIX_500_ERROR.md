# Fix 500 Internal Server Error on Login

## ✅ Good News!
The API URL is now correct: `https://olpmonitorke.com/api/auth/login` ✅

## ❌ Problem
Getting 500 Internal Server Error when trying to login.

This means:
- ✅ Frontend is connecting correctly
- ❌ Backend server is having an error (likely database connection)

---

## Most Common Causes

### 1. Database Connection Failed
The server can't connect to PostgreSQL on your VPS (72.60.23.73).

### 2. Missing Environment Variables
`DB_HOST`, `DB_PASSWORD`, or other database variables not set.

### 3. Database Not Set Up
Tables don't exist (migrations not run).

---

## Step 1: Check Server Logs

**On your hosting platform, check the server logs/console for errors.**

Look for errors like:
- `Error: connect ECONNREFUSED`
- `password authentication failed`
- `relation "users" does not exist`
- `JWT_SECRET is not set`

---

## Step 2: Verify Environment Variables

Make sure these are set in your deployment platform:

```
DB_HOST=72.60.23.73
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=z6hqp3qnmJDD5XW
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://olpmonitorke.com
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
```

**Critical:**
- `DB_HOST=72.60.23.73` (your VPS IP)
- `DB_PASSWORD` must match the password you set on VPS
- `JWT_SECRET` must be set (not empty)

---

## Step 3: Verify PostgreSQL on VPS is Accessible

SSH into your VPS and test:

```bash
ssh root@72.60.23.73

# Check PostgreSQL is running
systemctl status postgresql

# Test database connection
psql -U grade10_user -d grade10_lms -h localhost
# Enter password: z6hqp3qnmJDD5XW
```

If connection fails, PostgreSQL isn't configured correctly.

---

## Step 4: Check PostgreSQL Remote Access

On your VPS, verify PostgreSQL allows remote connections:

```bash
# Check if PostgreSQL is listening on all interfaces
netstat -tulpn | grep 5432

# Should show: 0.0.0.0:5432 (not just 127.0.0.1:5432)
```

If it only shows `127.0.0.1:5432`, PostgreSQL isn't configured for remote access.

**Fix:** Follow the steps in `VPS_REMOTE_DATABASE_SETUP.md` to configure remote access.

---

## Step 5: Check Firewall

On your VPS, make sure port 5432 is open:

```bash
ufw status
```

Should show:
```
5432/tcp                    ALLOW       Anywhere
```

If not, allow it:
```bash
ufw allow 5432/tcp
```

---

## Step 6: Verify Database Tables Exist

On your VPS, check if tables exist:

```bash
psql -U grade10_user -d grade10_lms -h localhost

# In psql:
\dt
```

Should show tables like: `users`, `courses`, `assignments`, etc.

If no tables, run migrations:
```bash
cd /var/www/olp  # or wherever your code is
npm run migrate
```

---

## Step 7: Test Database Connection from Hosting Server

If possible, test the connection from your hosting server:

```bash
# If you have SSH access to hosting server
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432
```

Or test with Node.js:
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  host: '72.60.23.73',
  port: 5432,
  database: 'grade10_lms',
  user: 'grade10_user',
  password: 'z6hqp3qnmJDD5XW'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Error:', err);
  else console.log('Connected!', res.rows);
  pool.end();
});
```

---

## Common Error Messages & Fixes

### Error: "connect ECONNREFUSED 72.60.23.73:5432"
**Cause:** Can't connect to PostgreSQL on VPS  
**Fix:**
- Check PostgreSQL is running on VPS
- Check firewall allows port 5432
- Verify `DB_HOST=72.60.23.73` is set

### Error: "password authentication failed"
**Cause:** Wrong password or user  
**Fix:**
- Verify `DB_PASSWORD` matches VPS database password
- Verify `DB_USER=grade10_user` (not `postgres`)

### Error: "relation 'users' does not exist"
**Cause:** Database tables not created  
**Fix:**
- Run migrations: `npm run migrate` on VPS or hosting server

### Error: "JWT_SECRET is not set"
**Cause:** Missing JWT_SECRET environment variable  
**Fix:**
- Add `JWT_SECRET=your_random_secret_here` to environment variables

---

## Quick Diagnostic Checklist

- [ ] Server logs checked (what's the actual error?)
- [ ] `DB_HOST=72.60.23.73` is set
- [ ] `DB_PASSWORD` is correct
- [ ] `JWT_SECRET` is set
- [ ] PostgreSQL running on VPS
- [ ] PostgreSQL configured for remote access
- [ ] Firewall allows port 5432
- [ ] Database tables exist (migrations run)
- [ ] Can connect to database from VPS
- [ ] Can connect to database from hosting server (if possible)

---

## Next Steps

1. **Check your server logs first** - this will tell you the exact error
2. **Verify environment variables** are set correctly
3. **Test database connection** from VPS
4. **Check PostgreSQL remote access** configuration

**The server logs will show the exact error - that's the key to fixing this!** 🔍

---

## Summary

**Status:**
- ✅ Frontend fixed (API URL correct)
- ❌ Backend error (500 - likely database connection)

**Action:**
1. Check server logs for exact error
2. Verify database connection settings
3. Test PostgreSQL on VPS
4. Fix the specific error shown in logs

**Share the server log error message and I can help fix it specifically!** 🚀












