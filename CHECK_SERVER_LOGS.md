# Check Server Logs - Find Database Connection Error

## Problem
Can't run Node.js from command line on hosting platform.

## Solution: Check Server Logs

The server logs will show the exact database connection error when you try to login.

---

## Step 1: Access Server Logs

### On Your Hosting Platform:

1. **Go to your hosting dashboard**
2. **Find one of these:**
   - "Logs" section
   - "Console" section
   - "Runtime Logs"
   - "Application Logs"
   - "Error Logs"
   - "Activity Logs"

3. **Look for recent errors** (when you tried to login)

---

## Step 2: Try to Login and Watch Logs

1. **Open server logs** in one window/tab
2. **Go to:** https://olpmonitorke.com/
3. **Try to login** with: `student1` / `password123`
4. **Watch the logs** - errors will appear immediately

---

## Step 3: Common Errors You'll See

### Error 1: `password authentication failed`
```
Error: password authentication failed for user "grade10_user"
```

**Fix:** Password mismatch
- Update VPS database password to match hosting platform
- Or update hosting platform password to match VPS

---

### Error 2: `database "xxx" does not exist`
```
Error: database "xxx" does not exist
```

**Fix:** Wrong database name
- Check `DB_NAME=grade10_lms` in environment variables
- Verify database exists on VPS

---

### Error 3: `connection refused` or `ECONNREFUSED`
```
Error: connect ECONNREFUSED 72.60.23.73:5432
```

**Fix:** Can't connect to VPS
- PostgreSQL not configured for remote access
- Firewall blocking port 5432
- PostgreSQL not running

---

### Error 4: `timeout` or `ETIMEDOUT`
```
Error: connect ETIMEDOUT 72.60.23.73:5432
```

**Fix:** Connection timeout
- Firewall blocking
- Network issue
- PostgreSQL not accessible

---

### Error 5: `JWT_SECRET is not set`
```
JWT_SECRET is not set in environment variables
```

**Fix:** Add `JWT_SECRET` to environment variables

---

## Step 4: Fix Based on Error

### If "password authentication failed":

On VPS:
```bash
sudo -u postgres psql
ALTER USER grade10_user WITH PASSWORD 'YourSecurePassword123!';
\q
```

---

### If "database does not exist":

On VPS:
```bash
sudo -u postgres psql
CREATE DATABASE grade10_lms OWNER grade10_user;
\q
```

---

### If "connection refused":

On VPS, configure PostgreSQL for remote access:

```bash
# 1. Edit postgresql.conf
nano /etc/postgresql/*/main/postgresql.conf
# Change: listen_addresses = '*'

# 2. Edit pg_hba.conf
nano /etc/postgresql/*/main/pg_hba.conf
# Add: host    grade10_lms    grade10_user    0.0.0.0/0    md5

# 3. Restart
systemctl restart postgresql

# 4. Allow firewall
ufw allow 5432/tcp
```

---

## Alternative: Check Application Logs

If you can't find server logs, check:

1. **Application error logs** - Usually in a `logs/` directory
2. **PHP error logs** - If using PHP
3. **Apache/Nginx logs** - Web server logs
4. **PM2 logs** - If using PM2: `pm2 logs`

---

## Quick Diagnostic

**What to do:**
1. Open server logs
2. Try to login
3. Copy the exact error message
4. Share it with me

**The error message will tell us exactly what's wrong!**

---

## Summary

**Since Node.js isn't available:**
- ✅ Check server logs instead
- ✅ Try to login and watch for errors
- ✅ The error will show exactly what's wrong

**What error do you see in the server logs when you try to login?** 🔍












