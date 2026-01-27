# Fix: npm run migrate - Wrong Directory

## Problem
```
npm ERR! path /root/package.json
npm ERR! enoent ENOENT: no such file or directory
```

**Cause:** You're in `/root/` directory, but the project files are in a different location.

---

## Solution: Navigate to Project Directory

### Step 1: Find Where Your Project Is

On your VPS, try these locations:

```bash
# Check common locations
ls /var/www/olp
ls /var/www
ls /home
ls ~/olp
```

### Step 2: Navigate to Project Directory

Most likely locations:

```bash
# Option 1: If in /var/www/olp
cd /var/www/olp

# Option 2: If in /var/www
cd /var/www
ls
# Then cd into your project folder

# Option 3: Check current directory
pwd
ls
```

### Step 3: Verify You're in the Right Place

Once you're in the project directory, verify:

```bash
# Check if package.json exists
ls package.json

# Check if migrations folder exists
ls migrations/

# Check if server.js exists
ls server.js
```

If all these files exist, you're in the right place!

---

## Step 4: Run Migrations

Now that you're in the correct directory:

```bash
# Make sure you're in the project directory
cd /var/www/olp  # or wherever your project is

# Verify you're in the right place
ls package.json

# Run migrations
npm run migrate
```

---

## Quick Commands

```bash
# Find your project
find / -name "package.json" -type f 2>/dev/null | grep olp

# Or check common locations
ls -la /var/www/olp
ls -la /home/*/olp
ls -la ~/olp

# Once found, navigate there
cd /path/to/your/project

# Verify
ls package.json migrations/ server.js

# Run migrations
npm run migrate
```

---

## If Project Doesn't Exist on VPS

If you can't find the project files, you need to upload them first:

### Option 1: Upload via SCP (from your Windows machine)

```powershell
# From your Windows PowerShell
cd C:\Users\JAKE\Documents\olp

# Upload entire project
scp -r * root@72.60.23.73:/var/www/olp/
```

### Option 2: Clone from GitHub (if you have a repo)

```bash
# On VPS
cd /var/www
git clone https://github.com/yourusername/your-repo.git olp
cd olp
npm install
npm run migrate
```

---

## Complete Steps

```bash
# 1. Navigate to project (adjust path as needed)
cd /var/www/olp

# 2. Verify you're in the right place
ls package.json
ls migrations/

# 3. Check .env file exists
ls .env

# 4. Run migrations
npm run migrate

# 5. Verify tables were created
psql -U grade10_user -d grade10_lms -h localhost
\dt
\q
```

---

## Summary

**Problem:** Running `npm run migrate` from wrong directory (`/root/`)  
**Solution:** Navigate to project directory first (likely `/var/www/olp`)  
**Then:** Run `npm run migrate`

**Try:**
```bash
cd /var/www/olp
npm run migrate
```

If that doesn't work, find where your project files are first! 🔍


