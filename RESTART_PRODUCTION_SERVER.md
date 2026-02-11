# How to Restart the Production Server (VPS)

## Quick Restart Commands

### SSH into VPS
```bash
ssh root@72.60.23.73
```

### Restart the Server
```bash
cd /var/www/olp
pm2 restart olp-app
```

### Check Status
```bash
pm2 status
pm2 logs olp-app --lines 20
```

---

## Step-by-Step Guide

### Step 1: Connect to VPS
**On your local computer (PowerShell or Terminal):**
```bash
ssh root@72.60.23.73
```

**Enter your VPS password when prompted.**

---

### Step 2: Navigate to Application Directory
```bash
cd /var/www/olp
```

---

### Step 3: Restart the Server

**Option A: Simple Restart (Recommended)**
```bash
pm2 restart olp-app
```

**Option B: Stop and Start (Full Restart)**
```bash
pm2 stop olp-app
pm2 start olp-app
```

**Option C: Reload (Zero Downtime)**
```bash
pm2 reload olp-app
```

---

### Step 4: Verify Server is Running
```bash
pm2 status
```

**Should show:**
```
┌─────┬──────────┬─────────┬─────────┬─────────┐
│ id  │ name     │ status  │ cpu     │ memory  │
├─────┼──────────┼─────────┼─────────┼─────────┤
│ 0   │ olp-app  │ online  │ 0%      │ 45.2mb  │
└─────┴──────────┴─────────┴─────────┴─────────┘
```

---

### Step 5: Check Logs (Optional)
```bash
pm2 logs olp-app --lines 50
```

**Look for:**
```
Senior School OLP Server running on port 3000
Environment: production
```

---

## After Making Code Changes

If you've uploaded new code files to the VPS:

### 1. Navigate to App Directory
```bash
cd /var/www/olp
```

### 2. Install New Dependencies (if package.json changed)
```bash
npm install
```

### 3. Restart Server
```bash
pm2 restart olp-app
```

### 4. Check Logs for Errors
```bash
pm2 logs olp-app --lines 50
```

---

## Common PM2 Commands

```bash
# View all processes
pm2 status

# View logs
pm2 logs olp-app

# View last 50 lines of logs
pm2 logs olp-app --lines 50

# Restart
pm2 restart olp-app

# Stop
pm2 stop olp-app

# Start
pm2 start olp-app

# Reload (zero downtime)
pm2 reload olp-app

# Delete from PM2
pm2 delete olp-app

# Monitor (real-time)
pm2 monit
```

---

## Troubleshooting

### Server Won't Start
```bash
# Check logs for errors
pm2 logs olp-app --err

# Check if port 3000 is in use
netstat -tulpn | grep 3000

# Check .env file exists
cat /var/www/olp/.env
```

### Server Keeps Crashing
```bash
# View error logs
pm2 logs olp-app --err --lines 100

# Check database connection
sudo -u postgres psql -d grade10_lms -c "SELECT 1;"
```

### Changes Not Reflecting
1. **Make sure files were uploaded correctly:**
   ```bash
   ls -la /var/www/olp/public/index.html
   ```

2. **Clear browser cache** (Ctrl+Shift+R or Incognito mode)

3. **Check if server restarted:**
   ```bash
   pm2 restart olp-app
   pm2 logs olp-app --lines 20
   ```

---

## Quick Reference

**One-liner to restart:**
```bash
ssh root@72.60.23.73 "cd /var/www/olp && pm2 restart olp-app"
```

**One-liner to check status:**
```bash
ssh root@72.60.23.73 "pm2 status"
```

---

## Summary

1. **SSH into VPS:** `ssh root@72.60.23.73`
2. **Go to app directory:** `cd /var/www/olp`
3. **Restart server:** `pm2 restart olp-app`
4. **Check status:** `pm2 status`
5. **View logs:** `pm2 logs olp-app --lines 20`

That's it! Your changes should now be live! 🚀











