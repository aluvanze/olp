# Debug Database Connection: Domain → VPS

## Your Setup
- **Backend Server:** olpmonitorke.com (hosting platform)
- **Database:** 72.60.23.73 (VPS)
- **Problem:** Can't connect from domain to VPS database

---

## Step 1: Verify Environment Variables on Hosting Platform

On your hosting platform, check these are set correctly:

```env
DB_HOST=72.60.23.73
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=YourSecurePassword123!
```

**Important:** Make sure `DB_NAME=grade10_lms` (not something else)

---

## Step 2: Verify Database Exists on VPS

On your VPS, check if the database exists:

```bash
psql -U grade10_user -d grade10_lms -h localhost
```

If it says "database does not exist", create it:

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE grade10_lms OWNER grade10_user;
\q
```

---

## Step 3: Test Database Connection from Hosting

### Option A: If You Have Terminal Access on Hosting

Try to connect from hosting platform:

```bash
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432
```

Enter password: `YourSecurePassword123!`

**If this fails**, that's your problem - can't connect from hosting to VPS.

---

### Option B: Test with Node.js Script

Create a test script on your hosting platform:

```javascript
// test-db-connection.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Connection Error:', err.message);
    console.error('Details:', err);
  } else {
    console.log('✅ Connected!', res.rows[0]);
  }
  pool.end();
});
```

Run it:
```bash
node test-db-connection.js
```

This will show the exact error.

---

## Step 4: Check PostgreSQL Remote Access on VPS

On your VPS, verify PostgreSQL is configured for remote access:

### Check Configuration:

```bash
grep listen_addresses /etc/postgresql/*/main/postgresql.conf
```

**Should show:** `listen_addresses = '*'`

If it shows `#listen_addresses = 'localhost'`, PostgreSQL isn't configured for remote access.

### Fix:

```bash
nano /etc/postgresql/*/main/postgresql.conf
```

Find and change:
```
#listen_addresses = 'localhost'
```

To:
```
listen_addresses = '*'
```

Save: `Ctrl+X`, `Y`, `Enter`

### Check Authentication:

```bash
cat /etc/postgresql/*/main/pg_hba.conf | grep grade10
```

**Should show:**
```
host    grade10_lms    grade10_user    0.0.0.0/0    md5
```

If not, add it:

```bash
nano /etc/postgresql/*/main/pg_hba.conf
```

Add at the end:
```
host    grade10_lms    grade10_user    0.0.0.0/0    md5
```

Save and restart:
```bash
systemctl restart postgresql
```

---

## Step 5: Check Firewall on VPS

On VPS:

```bash
ufw status
```

**Should show:**
```
5432/tcp                    ALLOW       Anywhere
```

If not, allow it:

```bash
ufw allow 5432/tcp
```

---

## Step 6: Verify Database Name

On VPS, list all databases:

```bash
psql -U postgres -h localhost
```

```sql
\l
```

**Should see:** `grade10_lms` in the list

If not, create it:

```sql
CREATE DATABASE grade10_lms OWNER grade10_user;
\q
```

---

## Step 7: Check Server Logs on Hosting

On your hosting platform, check server logs for database connection errors:

**Look for:**
- `password authentication failed`
- `database "grade10_lms" does not exist`
- `connection refused`
- `timeout`
- `ECONNREFUSED`

---

## Common Issues & Fixes

### Issue 1: Database Name Wrong
**Error:** `database "xxx" does not exist`  
**Fix:** Make sure `DB_NAME=grade10_lms` in hosting environment variables

### Issue 2: PostgreSQL Not Listening Remotely
**Error:** `connection refused`  
**Fix:** Set `listen_addresses = '*'` in `postgresql.conf`

### Issue 3: Authentication Not Allowed
**Error:** `password authentication failed`  
**Fix:** Add entry to `pg_hba.conf` for remote access

### Issue 4: Firewall Blocking
**Error:** `connection timeout`  
**Fix:** Allow port 5432 in firewall: `ufw allow 5432/tcp`

### Issue 5: Wrong Password
**Error:** `password authentication failed`  
**Fix:** Make sure password in hosting matches VPS database password

---

## Quick Diagnostic Commands

### On VPS:

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Check if listening on all interfaces
netstat -tulpn | grep 5432
# Should show: 0.0.0.0:5432

# Check firewall
ufw status
# Should show: 5432/tcp ALLOW

# Test local connection
psql -U grade10_user -d grade10_lms -h localhost
# Should connect
```

### On Hosting Platform (if possible):

```bash
# Test remote connection
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432
# Should connect with password: YourSecurePassword123!
```

---

## Step-by-Step Fix

1. **Verify database exists on VPS:**
   ```bash
   psql -U grade10_user -d grade10_lms -h localhost
   ```

2. **Configure PostgreSQL for remote access:**
   - Set `listen_addresses = '*'`
   - Add `pg_hba.conf` entry
   - Restart PostgreSQL

3. **Allow firewall:**
   ```bash
   ufw allow 5432/tcp
   ```

4. **Verify environment variables on hosting:**
   - `DB_HOST=72.60.23.73`
   - `DB_NAME=grade10_lms`
   - `DB_USER=grade10_user`
   - `DB_PASSWORD=YourSecurePassword123!`

5. **Test connection from hosting** (if possible)

6. **Check server logs** for exact error

---

## Summary

**Your Setup:**
- Backend: olpmonitorke.com
- Database: 72.60.23.73

**Most Likely Issues:**
1. PostgreSQL not configured for remote access
2. Firewall blocking port 5432
3. Database name mismatch
4. Password mismatch

**Action:**
1. Check server logs for exact error
2. Verify PostgreSQL remote access configuration
3. Test database connection
4. Fix the specific issue

**What error do you see in the server logs?** That will tell us exactly what's wrong! 🔍













