# Debug 500 Error - Final Steps

## Current Status
- ✅ API URL correct
- ✅ Environment variables set
- ✅ Tables created
- ✅ Users seeded
- ❌ Still getting 500 error

## Step 1: Check Server Logs (MOST IMPORTANT!)

The server logs will show the EXACT error.

### On Your Hosting Platform:
1. Go to hosting dashboard
2. Find "Logs" or "Console" or "Runtime Logs"
3. Look for recent errors when you try to login

**What error do you see?**
- `password authentication failed` → Password mismatch
- `JWT_SECRET is not set` → Missing JWT_SECRET
- `connection refused` → Can't connect to database
- `relation "users" does not exist` → Tables issue
- Other error → Share the message

---

## Step 2: Verify Database Password Match

### Check What Password is in Database:

On VPS:
```bash
sudo -u postgres psql
```

```sql
SELECT usename, passwd FROM pg_shadow WHERE usename = 'grade10_user';
\q
```

### Check What Password Hosting Platform Has:

In your hosting platform environment variables:
- Should be: `DB_PASSWORD=YourSecurePassword123!`

### They Must Match!

If they don't match, update the database password:

```bash
sudo -u postgres psql
```

```sql
ALTER USER grade10_user WITH PASSWORD 'YourSecurePassword123!';
\q
```

---

## Step 3: Test Database Connection

### From VPS (Should Work):
```bash
psql -U grade10_user -d grade10_lms -h localhost
# Enter: YourSecurePassword123!
```

### From Hosting Platform (If Possible):
```bash
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432
# Enter: YourSecurePassword123!
```

If this fails, that's the problem!

---

## Step 4: Verify PostgreSQL Remote Access

On VPS, check if PostgreSQL allows remote connections:

```bash
# Check if listening on all interfaces
netstat -tulpn | grep 5432
```

Should show: `0.0.0.0:5432` (not just `127.0.0.1:5432`)

If only showing `127.0.0.1`, PostgreSQL isn't configured for remote access.

**Fix:** Follow steps in `VPS_REMOTE_DATABASE_SETUP.md`

---

## Step 5: Check Firewall

On VPS:
```bash
ufw status
```

Should show port 5432 is allowed:
```
5432/tcp                    ALLOW       Anywhere
```

If not, allow it:
```bash
ufw allow 5432/tcp
```

---

## Step 6: Restart Server After Changes

**Important:** After changing environment variables or database password:

1. **Restart/redeploy** your hosting application
2. **Wait 1-2 minutes**
3. **Test login again**

---

## Most Common Issues

### Issue 1: Password Mismatch
**Error:** `password authentication failed`  
**Fix:** Update VPS database password to match hosting platform

### Issue 2: PostgreSQL Not Accessible Remotely
**Error:** `connection refused` or `ECONNREFUSED`  
**Fix:** Configure PostgreSQL for remote access (see `VPS_REMOTE_DATABASE_SETUP.md`)

### Issue 3: Firewall Blocking
**Error:** `connection timeout`  
**Fix:** Allow port 5432 in firewall

### Issue 4: Server Not Restarted
**Error:** Any error  
**Fix:** Restart server after environment variable changes

---

## Quick Diagnostic Checklist

- [ ] Server logs checked - what's the exact error?
- [ ] Database password matches in both places
- [ ] PostgreSQL configured for remote access (`listen_addresses = '*'`)
- [ ] Firewall allows port 5432
- [ ] Can connect to database from VPS
- [ ] Can connect to database from hosting (if possible)
- [ ] Server restarted after environment variable changes
- [ ] All environment variables set correctly

---

## Action Plan

1. **Check server logs first** - This will tell you exactly what's wrong
2. **Verify database password** matches in both places
3. **Test database connection** from hosting to VPS
4. **Check PostgreSQL remote access** configuration
5. **Restart server** after any changes

---

## Summary

**The server logs will show the exact error!**

**Most likely issues:**
1. Password mismatch
2. PostgreSQL not accessible remotely
3. Firewall blocking connection

**Share the server log error message and I can help fix it specifically!** 🔍













