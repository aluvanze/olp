# Debug 500 Error on Login

## Current Status
- ✅ Frontend connecting correctly
- ✅ API URL is correct
- ❌ Backend returning 500 error

---

## Step 1: Verify Tables Were Created

On your VPS:

```bash
psql -U grade10_user -d grade10_lms -h localhost
\dt
```

**If you see tables listed** (users, courses, etc.) → Tables exist ✅  
**If you see "Did not find any relations"** → Need to run migrations again

---

## Step 2: Check Server Logs

**This is the most important step!** The server logs will show the exact error.

### If Using PM2:
```bash
pm2 logs
# Or
pm2 logs olp-app
```

### If Using npm start:
Check the terminal/console where the server is running.

### If Using Hosting Platform:
Check the platform's logs/console section.

**Look for errors like:**
- `relation "users" does not exist`
- `JWT_SECRET is not set`
- `password authentication failed`
- `connection refused`

---

## Step 3: Common Causes & Fixes

### Cause 1: Tables Don't Exist

**Error in logs:** `relation "users" does not exist`

**Fix:**
```bash
cd /var/www/olp
npm run migrate
```

Then verify:
```bash
psql -U grade10_user -d grade10_lms -h localhost
\dt
```

---

### Cause 2: Missing JWT_SECRET

**Error in logs:** `JWT_SECRET is not set`

**Fix:**
```bash
cd /var/www/olp
nano .env
```

Add/update:
```env
JWT_SECRET=your_random_secret_string_here
```

Generate a secret:
```bash
openssl rand -base64 32
```

Use that value for `JWT_SECRET.

---

### Cause 3: Database Connection Failed

**Error in logs:** `connection refused` or `ECONNREFUSED`

**Fix:**
1. Check `.env` has correct database credentials
2. Verify PostgreSQL is running:
   ```bash
   systemctl status postgresql
   ```
3. Test connection:
   ```bash
   psql -U grade10_user -d grade10_lms -h localhost
   ```

---

### Cause 4: Wrong Database User

**Error in logs:** `password authentication failed`

**Fix:**
Check `.env`:
```env
DB_USER=grade10_user
DB_PASSWORD=z6hqp3qnmJDD5XW
```

Not:
```env
DB_USER=postgres  # WRONG!
```

---

## Step 4: Quick Diagnostic

Run this on your VPS to test the database connection:

```bash
cd /var/www/olp
node -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ host: process.env.DB_HOST || 'localhost', port: 5432, database: 'grade10_lms', user: 'grade10_user', password: 'z6hqp3qnmJDD5XW' }); pool.query('SELECT COUNT(*) FROM users', (err, res) => { if (err) console.error('Error:', err.message); else console.log('✅ Connected! Users table exists. Count:', res.rows[0].count); pool.end(); });"
```

**If it works:** Database connection is OK  
**If it fails:** Shows the exact error

---

## Step 5: Check Environment Variables

On your VPS:

```bash
cd /var/www/olp
cat .env | grep -E "DB_|JWT_|NODE_ENV"
```

Should show:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=z6hqp3qnmJDD5XW
JWT_SECRET=something_here
NODE_ENV=production
```

---

## Most Likely Issues

Based on what we've done:

1. **Tables don't exist** - Migrations rolled back, need to run again
2. **Missing JWT_SECRET** - Not set in `.env`
3. **Wrong database credentials** - `.env` has wrong values

---

## Action Plan

1. ✅ **Check if tables exist:** `psql -U grade10_user -d grade10_lms -h localhost` then `\dt`
2. ✅ **Check server logs** - Find the exact error message
3. ✅ **Verify `.env` file** - All variables set correctly
4. ✅ **Run migrations again** if tables don't exist
5. ✅ **Restart server** after fixing `.env`

---

## Quick Fix Checklist

- [ ] Tables exist? (`\dt` in psql)
- [ ] `.env` has `JWT_SECRET` set?
- [ ] `.env` has correct `DB_USER=grade10_user`?
- [ ] `.env` has correct `DB_PASSWORD`?
- [ ] Server logs checked for exact error?
- [ ] Server restarted after changes?

---

**The server logs will tell you exactly what's wrong! Check them first!** 🔍













