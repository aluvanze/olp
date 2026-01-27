# Fix Server Error During Login

## Progress! ✅

You're now getting:
- ✅ **"Server error during login"** instead of `ERR_CONNECTION_REFUSED`
- ✅ Frontend is connecting to backend correctly
- ❌ Backend is returning a 500 error

**This means:** The API URL is fixed, but there's a server-side issue.

---

## Step 1: Check Server Logs for Exact Error

**On hosting platform SSH:**

```bash
cd ~/domains/olpmonitorke.com/public_html
tail -50 stderr.log
```

**Or watch in real-time:**

```bash
tail -f stderr.log
```

Then try to login on the website and watch the log.

**Share the exact error message you see!**

---

## Common Errors and Fixes

### Error 1: `password authentication failed`

```
Error: password authentication failed for user "grade10_user"
```

**Fix:** Password mismatch between hosting and VPS

**On VPS:**
```bash
sudo -u postgres psql
ALTER USER grade10_user WITH PASSWORD 'YourSecurePassword123!';
\q
```

**On hosting, verify `.env` has:**
```
DB_PASSWORD=YourSecurePassword123!
```

---

### Error 2: `JWT_SECRET is not set`

```
JWT_SECRET is not set in environment variables
```

**Fix:** Add JWT_SECRET to hosting environment variables

**Generate a secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add to hosting `.env`:**
```
JWT_SECRET=your-generated-secret-here
```

---

### Error 3: `relation "users" does not exist`

```
Error: relation "users" does not exist
```

**Fix:** Database tables not migrated

**On hosting:**
```bash
cd ~/domains/olpmonitorke.com/public_html
npm run migrate
```

---

### Error 4: `connect ECONNREFUSED` (still)

```
Error: connect ECONNREFUSED 72.60.23.73:5432
```

**Fix:** PostgreSQL still not accepting connections
- Verify `listen_addresses = '*'` on VPS
- Verify `pg_hba.conf` has remote access rule
- Verify firewall allows port 5432

---

### Error 5: `timeout` or `ETIMEDOUT`

```
Error: connect ETIMEDOUT 72.60.23.73:5432
```

**Fix:** Network/firewall issue
- Check VPS firewall
- Check if PostgreSQL is running on VPS
- Verify IP address is correct

---

## Step 2: Verify Environment Variables

**On hosting platform:**

```bash
cd ~/domains/olpmonitorke.com/public_html
cat .env | grep -E "DB_|JWT_|FRONTEND_|PORT"
```

**Should show:**
```
DB_HOST=72.60.23.73
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=your-secret-here
FRONTEND_URL=https://olpmonitorke.com
PORT=3000
NODE_ENV=production
```

---

## Step 3: Test Database Connection

**On hosting platform, create a test script:**

```bash
cd ~/domains/olpmonitorke.com/public_html
cat > test-connection.js << 'EOF'
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
    console.error('Connection error:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful!');
    console.log('Current time:', res.rows[0].now);
    process.exit(0);
  }
});
EOF
```

**Try to run it** (if Node.js is available in a different path):
```bash
# Find Node.js
which node
whereis node
find /usr -name node 2>/dev/null

# If found, run:
/path/to/node test-connection.js
```

---

## Step 4: Check if Database Tables Exist

**On VPS, verify tables:**

```bash
sudo -u postgres psql -d grade10_lms -c "\dt"
```

**Should show tables like:**
- users
- students
- subjects
- etc.

**If no tables, run migrations on hosting:**
```bash
cd ~/domains/olpmonitorke.com/public_html
npm run migrate
```

---

## Most Likely Issues

Based on previous troubleshooting:

1. **Password mismatch** - Most likely!
   - Hosting has: `DB_PASSWORD=YourSecurePassword123!`
   - VPS user has: Different password
   - **Fix:** Update VPS password to match

2. **Missing JWT_SECRET**
   - Backend needs JWT_SECRET for authentication
   - **Fix:** Add to `.env` on hosting

3. **Database tables not migrated**
   - Tables don't exist in database
   - **Fix:** Run `npm run migrate` on hosting

---

## Quick Diagnostic

**Run these commands on hosting:**

```bash
# 1. Check stderr.log for exact error
tail -50 stderr.log

# 2. Check environment variables
cat .env | grep -E "DB_|JWT_"

# 3. Check if tables exist (if you can connect)
# (This requires psql or a test script)
```

---

## Summary

**Status:** Frontend → Backend connection works ✅  
**Issue:** Backend → Database or server configuration ❌

**Next steps:**
1. ✅ Check `stderr.log` for exact error
2. ✅ Verify environment variables
3. ✅ Fix based on error message

**What error do you see in `stderr.log`?** Share it and I'll help fix it! 🔍


