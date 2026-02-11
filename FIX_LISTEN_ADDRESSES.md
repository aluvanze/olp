# Fix PostgreSQL listen_addresses

## Problem Found!

Your `netstat` shows:
```
tcp  0  0  127.0.0.1:5432  ...  LISTEN  .../postgres
```

**This means:** PostgreSQL is only listening on localhost (127.0.0.1), NOT on all interfaces.

**Your `postgresql.conf` shows:**
```
#listen_addresses = ''
```

**This is commented out!** It needs to be uncommented and set to `'*'`.

---

## Fix: Edit postgresql.conf

### Step 1: Open the file

```bash
nano /etc/postgresql/*/main/postgresql.conf
```

---

### Step 2: Find and Change listen_addresses

1. **Press `Ctrl+W`** to search
2. **Type:** `listen_addresses`
3. **Press Enter**

You'll see:
```
#listen_addresses = ''          # what IP address(es) to listen on;
```

**Change it to:**
```
listen_addresses = '*'          # what IP address(es) to listen on;
```

**Important:**
- Remove the `#` at the beginning
- Change `''` to `'*'`
- Keep the comment on the right side

---

### Step 3: Save the File

1. **Press `Ctrl+X`** to exit
2. **Press `Y`** to confirm save
3. **Press `Enter`** to confirm filename

---

### Step 4: Restart PostgreSQL

```bash
systemctl restart postgresql
systemctl status postgresql
```

**Wait for:** `Active: active (exited)` or `Active: active (running)`

---

### Step 5: Verify It's Listening on All Interfaces

```bash
netstat -tulpn | grep 5432
```

**Should now show:**
```
tcp  0  0  0.0.0.0:5432  0.0.0.0:*  LISTEN  .../postgres
```

**NOT:**
```
tcp  0  0  127.0.0.1:5432  ...  LISTEN  .../postgres
```

If you see `0.0.0.0:5432`, it's working! ✅

---

## Quick Summary

**Before:**
```
#listen_addresses = ''
```
PostgreSQL listening on: `127.0.0.1:5432` (localhost only)

**After:**
```
listen_addresses = '*'
```
PostgreSQL listening on: `0.0.0.0:5432` (all interfaces) ✅

---

## After Fixing

1. **Wait 1-2 minutes**
2. **Try login again** on https://olpmonitorke.com/
3. **Check stderr.log** on hosting:
   ```bash
   tail -f stderr.log
   ```

The `ECONNREFUSED` error should be gone! 🚀

---

## If Still Not Working

If `netstat` still shows `127.0.0.1:5432` after restart:

1. **Double-check** the file was saved:
   ```bash
   grep listen_addresses /etc/postgresql/*/main/postgresql.conf
   ```
   Should show: `listen_addresses = '*'` (without `#`)

2. **Check PostgreSQL logs:**
   ```bash
   journalctl -u postgresql -n 50
   ```

3. **Verify pg_hba.conf** has the remote access rule:
   ```bash
   tail -5 /etc/postgresql/*/main/pg_hba.conf
   ```
   Should show: `host    grade10_lms    grade10_user    0.0.0.0/0    md5`

---

## Summary

**Current Status:** PostgreSQL only listening on localhost  
**Fix:** Change `listen_addresses = '*'` in postgresql.conf  
**Verify:** `netstat` should show `0.0.0.0:5432` after restart

**Make the change and restart PostgreSQL!** 🔧












