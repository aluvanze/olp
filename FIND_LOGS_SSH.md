# Find Server Logs via SSH

## You Have SSH Access to Hosting Platform

Let's find the logs and check what's happening.

---

## Step 1: Find Your Application Directory

You're already in:
```
/domains/olpmonitorke.com
```

Check what's in this directory:

```bash
ls -la
```

Look for:
- `logs/` directory
- `node_modules/` (confirms Node.js app)
- `server.js` or `app.js`
- `.env` file

---

## Step 2: Check for Log Files

```bash
# Check for logs directory
ls -la logs/

# Or check for log files
find . -name "*.log" -type f

# Check for PM2 logs (if using PM2)
ls -la ~/.pm2/logs/
```

---

## Step 3: Check Application Status

### If Using PM2:
```bash
# Check if PM2 is installed
which pm2

# Check PM2 status
pm2 list

# View PM2 logs
pm2 logs
```

### If Using systemd:
```bash
# Check service status
systemctl status your-app-name

# View logs
journalctl -u your-app-name -n 50
```

---

## Step 4: Check for Node.js Process

```bash
# Find Node.js processes
ps aux | grep node

# Check what port is being used
netstat -tulpn | grep node
# Or
ss -tulpn | grep node
```

---

## Step 5: Check Application Error Output

### Check if there's an error log:
```bash
# Common log locations
tail -f logs/error.log
tail -f logs/app.log
tail -f error.log
tail -f app.log

# Or check stderr/stdout if redirected
cat nohup.out
```

---

## Step 6: Try to Start Server Manually (to see errors)

```bash
# Find Node.js
which node
# Or
whereis node

# If found, try to start server
node server.js
# Or
node app.js
```

This will show errors in real-time.

---

## Step 7: Check Environment Variables

```bash
# Check if .env file exists
cat .env

# Or check environment variables
env | grep DB_
env | grep JWT_
```

---

## Step 8: Check Application Configuration

```bash
# Check package.json
cat package.json

# Check if dependencies are installed
ls node_modules/ | head -5
```

---

## Most Likely: Check PM2 Logs

If your hosting uses PM2:

```bash
# Check PM2
pm2 list

# View logs
pm2 logs

# View last 50 lines
pm2 logs --lines 50
```

---

## Alternative: Check Web Server Logs

If using Apache/Nginx:

```bash
# Apache logs
tail -f /var/log/apache2/error.log
# Or
tail -f /var/log/httpd/error_log

# Nginx logs
tail -f /var/log/nginx/error.log
```

---

## Quick Commands to Try

```bash
# 1. Check current directory contents
ls -la

# 2. Find Node.js
which node
whereis node

# 3. Check for PM2
pm2 list
pm2 logs

# 4. Check running processes
ps aux | grep node

# 5. Check for log files
find . -name "*.log" -type f

# 6. Try to see .env
cat .env | grep DB_
```

---

## Summary

**Since you have SSH access:**
1. ✅ Check for log files
2. ✅ Check PM2 logs (if using PM2)
3. ✅ Try to start server manually to see errors
4. ✅ Check environment variables

**Run these commands and share what you find!** 🔍












