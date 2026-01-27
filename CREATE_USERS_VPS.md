# Create Users on VPS - Seed Database

## Problem

You're getting:
```
Invalid username or password. Users not installed on system.
```

**This means:** The database tables exist, but there are no users yet.

---

## Solution: Run Seed Script or Create Superadmin

You have two options:

### Option 1: Seed All Default Users (Recommended)

This creates multiple default users with password `password123`:
- `headteacher` / `password123`
- `deputy` / `password123`
- `finance` / `password123`
- `teacher1` / `password123`
- `student1` / `password123`
- `parent1` / `password123`

### Option 2: Create Superadmin Only

This creates just one user:
- `superadmin` / `admin123`

---

## Step 1: Verify Database Tables Exist

**On VPS:**
```bash
sudo -u postgres psql -d grade10_lms -c "\dt"
```

**Should show tables like:**
- users
- students
- courses
- etc.

**If no tables, run migrations first:**
```bash
cd /var/www/olp
npm run migrate
```

---

## Option 1: Seed All Default Users

### On VPS:
```bash
cd /var/www/olp
npm run seed
```

**This will create:**
- Default users (headteacher, deputy, finance, teacher1, student1, parent1)
- Sample course and module
- All with password: `password123`

**After running, you can login with:**
- Username: `student1` / Password: `password123`
- Username: `headteacher` / Password: `password123`
- Username: `teacher1` / Password: `password123`
- etc.

---

## Option 2: Create Superadmin Only

### On VPS:
```bash
cd /var/www/olp
node create-superadmin.js
```

**This will create:**
- Username: `superadmin`
- Password: `admin123`

**After running, you can login with:**
- Username: `superadmin` / Password: `admin123`

---

## Step 2: Verify Users Were Created

**On VPS:**
```bash
sudo -u postgres psql -d grade10_lms -c "SELECT username, email, role FROM users;"
```

**Should show:**
```
   username   |         email          |      role       
--------------+------------------------+-----------------
 headteacher  | headteacher@school.com | headteacher
 student1     | student1@school.com    | student
 ...
```

**If empty, the seed script didn't run correctly.**

---

## Step 3: Test Login

1. **Go to:** http://72.60.23.73/ (or your domain)
2. **Try to login** with one of the default users:

**For seeded users:**
- Username: `student1`
- Password: `password123`

**For superadmin:**
- Username: `superadmin`
- Password: `admin123`

---

## Troubleshooting

### Error: "Cannot find module 'bcryptjs'"

**Fix:** Install dependencies:
```bash
cd /var/www/olp
npm install
```

---

### Error: "relation 'users' does not exist"

**Fix:** Run migrations first:
```bash
cd /var/www/olp
npm run migrate
```

---

### Error: "password authentication failed"

**Fix:** Check database connection in `.env`:
```bash
cat /var/www/olp/.env | grep DB_
```

**Should show:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=YourSecurePassword123!
```

---

### Error: "connection refused"

**Fix:** Check PostgreSQL is running:
```bash
systemctl status postgresql
```

**If not running:**
```bash
systemctl start postgresql
```

---

## Quick Reference: Default Users

### After Running `npm run seed`:

| Username    | Password     | Role           |
|-------------|--------------|----------------|
| headteacher | password123  | headteacher    |
| deputy      | password123  | deputy_headteacher |
| finance     | password123  | finance        |
| teacher1    | password123  | teacher        |
| student1    | password123  | student        |
| parent1     | password123  | parent         |

### After Running `node create-superadmin.js`:

| Username    | Password     | Role           |
|-------------|--------------|----------------|
| superadmin  | admin123     | superadmin     |

---

## Step 4: After Creating Users

1. **Clear browser cache** or use Incognito mode
2. **Try login** with one of the default users
3. **Change passwords** after first login (if needed)

---

## Summary

**Problem:** No users in database  
**Solution:** Run seed script or create superadmin  
**Command:** `npm run seed` or `node create-superadmin.js`  
**Test:** Login with default credentials

**Run the seed script on VPS and try login again!** 🚀


