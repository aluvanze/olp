# Fix Database Password Authentication Error

## Error
```
password authentication failed for user "postgres"
```

**Problem:** The `.env` file has wrong database credentials.

---

## Step 1: Check Current .env File

On your VPS:

```bash
cd /var/www/olp
cat .env
```

Look for these lines:
```
DB_HOST=...
DB_PORT=...
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
```

---

## Step 2: Fix .env File

Edit the `.env` file:

```bash
nano .env
```

Make sure it has these **exact** values:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration - POINT TO VPS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=z6hqp3qnmJDD5XW

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://olpmonitorke.com

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=noreply@grade10lms.com
```

**Important:**
- `DB_USER=grade10_user` (NOT `postgres`)
- `DB_PASSWORD=z6hqp3qnmJDD5XW` (use the password you created)
- `DB_HOST=localhost` (since you're on the VPS)

**To save in nano:**
- Press `Ctrl+X`
- Press `Y`
- Press `Enter`

---

## Step 3: Verify Password is Correct

Test the database connection:

```bash
psql -U grade10_user -d grade10_lms -h localhost
```

Enter password: `z6hqp3qnmJDD5XW`

If it connects successfully, you'll see:
```
grade10_lms=>
```

Type `\q` to exit.

---

## Step 4: If Password is Wrong, Reset It

If the password doesn't work, reset it:

```bash
sudo -u postgres psql
```

In psql:
```sql
ALTER USER grade10_user WITH PASSWORD 'z6hqp3qnmJDD5XW';
\q
```

Then update `.env` with the same password.

---

## Step 5: Run Migrations Again

After fixing `.env`:

```bash
cd /var/www/olp
npm run migrate
```

Should now work! ✅

---

## Quick Fix Commands

```bash
# 1. Navigate to project
cd /var/www/olp

# 2. Edit .env file
nano .env

# 3. Make sure these lines are correct:
# DB_USER=grade10_user
# DB_PASSWORD=z6hqp3qnmJDD5XW
# DB_HOST=localhost

# 4. Save (Ctrl+X, Y, Enter)

# 5. Test connection
psql -U grade10_user -d grade10_lms -h localhost

# 6. Run migrations
npm run migrate
```

---

## Common Issues

### Issue: DB_USER is "postgres" instead of "grade10_user"
**Fix:** Change to `DB_USER=grade10_user` in `.env`

### Issue: Wrong password
**Fix:** 
1. Reset password in PostgreSQL
2. Update `.env` with same password

### Issue: DB_HOST is wrong
**Fix:** Since you're on VPS, use `DB_HOST=localhost`

---

## Summary

**Error:** Password authentication failed  
**Cause:** Wrong credentials in `.env` file  
**Fix:** Update `.env` with correct `DB_USER` and `DB_PASSWORD`  
**Then:** Run `npm run migrate` again

**The key is making sure `.env` has:**
- `DB_USER=grade10_user` (not postgres)
- `DB_PASSWORD=z6hqp3qnmJDD5XW` (your actual password)


