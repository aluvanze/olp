# Fix ECONNREFUSED Error

## Error Found!
```
Error acquiring client AggregateError [ECONNREFUSED]
```

**This means:** Your hosting platform cannot connect to PostgreSQL on VPS (72.60.23.73:5432).

**Cause:** PostgreSQL is not configured to accept remote connections.

---

## Fix: Configure PostgreSQL for Remote Access on VPS

### Step 1: SSH into Your VPS

```bash
ssh root@72.60.23.73
```

---

### Step 2: Configure PostgreSQL to Listen on All Interfaces

```bash
nano /etc/postgresql/*/main/postgresql.conf
```

Find this line (use `Ctrl+W` to search):
```
#listen_addresses = 'localhost'
```

Change it to:
```
listen_addresses = '*'
```

**Save:** `Ctrl+X`, then `Y`, then `Enter`

---

### Step 3: Configure Client Authentication

```bash
nano /etc/postgresql/*/main/pg_hba.conf
```

Add this line at the end of the file:

```
host    grade10_lms    grade10_user    0.0.0.0/0    md5
```

**Save:** `Ctrl+X`, then `Y`, then `Enter`

---

### Step 4: Restart PostgreSQL

```bash
systemctl restart postgresql
systemctl status postgresql
```

---

### Step 5: Allow Firewall Port

```bash
ufw allow 5432/tcp
ufw status
```

Should show:
```
5432/tcp                    ALLOW       Anywhere
```

---

### Step 6: Verify PostgreSQL is Listening

```bash
netstat -tulpn | grep 5432
```

**Should show:**
```
tcp  0  0 0.0.0.0:5432  0.0.0.0:*  LISTEN  ...
```

If it shows `127.0.0.1:5432` instead of `0.0.0.0:5432`, PostgreSQL is still not configured correctly.

---

## Step 7: Test Connection from VPS

On VPS, test local connection:

```bash
psql -U grade10_user -d grade10_lms -h localhost
```

Enter password: `YourSecurePassword123!`

If this works, PostgreSQL is running correctly.

---

## Step 8: Verify Remote Access Works

After configuring, wait 1-2 minutes, then on your hosting platform:

```bash
# Try the test script again (if Node.js is available)
# Or check stderr.log again after trying to login
```

---

## Quick Commands Summary

On VPS:

```bash
# 1. Edit postgresql.conf
nano /etc/postgresql/*/main/postgresql.conf
# Change: listen_addresses = '*'

# 2. Edit pg_hba.conf
nano /etc/postgresql/*/main/pg_hba.conf
# Add: host    grade10_lms    grade10_user    0.0.0.0/0    md5

# 3. Restart PostgreSQL
systemctl restart postgresql

# 4. Allow firewall
ufw allow 5432/tcp

# 5. Verify
netstat -tulpn | grep 5432
# Should show: 0.0.0.0:5432
```

---

## After Fixing

1. **Wait 1-2 minutes** for changes to take effect
2. **Try login again** on https://olpmonitorke.com/
3. **Check stderr.log** again:
   ```bash
   tail -f stderr.log
   ```

If connection works, you'll see different output (or no errors).

---

## Summary

**Error:** `ECONNREFUSED`  
**Cause:** PostgreSQL not accepting remote connections  
**Fix:** Configure PostgreSQL for remote access on VPS  
**Steps:** 
1. Set `listen_addresses = '*'`
2. Add `pg_hba.conf` entry
3. Restart PostgreSQL
4. Allow firewall

**After fixing, the connection should work!** 🚀













