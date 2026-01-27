# Fix Environment Variables Mismatch

## Problem
You have TWO different `.env` files:
- **Hosting platform** (white) - Where backend server runs
- **VPS** (black) - Where database runs

They need to match for database connection to work!

---

## Current Mismatch

### Hosting Platform (White):
```
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=a2c+ekGpsRciDVZdK7YsjDyO3bw6scYqF/52HA29xYw=
```

### VPS (Black):
```
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=grade10_lms_secret_key_2024_secure_random_string
DB_HOST=localhost
```

---

## The Issue

**Database Password Mismatch:**
- Hosting has: `YourSecurePassword123!`
- But VPS database was created with: `z6hqp3qnmJDD5XW`

**This is why login fails!** The hosting platform can't connect to the database.

---

## Solution: Match the Passwords

You have two options:

### Option 1: Update VPS Database Password (Recommended)

On your VPS:

```bash
sudo -u postgres psql
```

In psql:
```sql
ALTER USER grade10_user WITH PASSWORD 'YourSecurePassword123!';
\q
```

Then update VPS `.env`:
```bash
cd /var/www/olp
nano .env
```

Change:
```env
DB_PASSWORD=YourSecurePassword123!
```

Save: `Ctrl+X`, `Y`, `Enter`

---

### Option 2: Update Hosting Platform Password

On your hosting platform, change:
```
DB_PASSWORD=z6hqp3qnmJDD5XW
```

To match what's on VPS.

---

## Complete Environment Variables

### For Hosting Platform (White):

```env
PORT=3000
NODE_ENV=production
DB_HOST=72.60.23.73
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=a2c+ekGpsRciDVZdK7YsjDyO3bw6scYqF/52HA29xYw=
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://olpmonitorke.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=noreply@grade10lms.com
```

**Important:**
- `DB_HOST=72.60.23.73` (VPS IP)
- `DB_PASSWORD` must match VPS database password

---

### For VPS (Black):

```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=a2c+ekGpsRciDVZdK7YsjDyO3bw6scYqF/52HA29xYw=
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://olpmonitorke.com
```

**Important:**
- `DB_HOST=localhost` (since database is on same VPS)
- `DB_PASSWORD` must match what's in PostgreSQL

---

## Step-by-Step Fix

### Step 1: Update VPS Database Password

On VPS:
```bash
sudo -u postgres psql
```

```sql
ALTER USER grade10_user WITH PASSWORD 'YourSecurePassword123!';
\q
```

### Step 2: Update VPS .env File

```bash
cd /var/www/olp
nano .env
```

Update:
```env
DB_PASSWORD=YourSecurePassword123!
```

Save: `Ctrl+X`, `Y`, `Enter`

### Step 3: Verify Hosting Platform

Make sure hosting platform has:
```
DB_HOST=72.60.23.73
DB_PASSWORD=YourSecurePassword123!
```

### Step 4: Restart Everything

**On Hosting Platform:**
- Restart/redeploy application

**On VPS (if running server there):**
```bash
pm2 restart olp-app
```

---

## Quick Test

After fixing, test database connection:

### From Hosting Platform (if possible):
```bash
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432
```

Enter password: `YourSecurePassword123!`

If it connects, password is correct! ✅

---

## Summary

**Problem:** Password mismatch between hosting and VPS  
**Fix:** Make passwords match in both places  
**Action:** Update VPS database password OR update hosting platform password

**After fixing, restart the server and test login!** 🚀


