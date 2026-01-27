# Fix 500 Error - API URL is Now Correct! ✅

## ✅ Great Progress!
- API URL is now correct: `https://olpmonitorke.com/api/auth/login` ✅
- Frontend is connecting properly ✅
- Now we have a 500 server error ❌

## Problem
500 Internal Server Error on login - this is a backend issue.

---

## Most Likely Causes

### 1. Missing JWT_SECRET (Most Common)
The login endpoint needs `JWT_SECRET` to generate tokens.

**Check:** Is `JWT_SECRET` set in your environment variables?

### 2. Database Connection Issue
Can't connect to PostgreSQL on VPS.

**Check:** Are database credentials correct?

### 3. Tables Missing Data
Users table might be empty (no users to login with).

**Check:** Did you run `npm run seed`?

---

## Step 1: Check Server Logs

**This will show the exact error!**

### If Using Hosting Platform:
- Go to your hosting dashboard
- Find "Logs" or "Console" section
- Look for error messages

### If Using PM2:
```bash
pm2 logs olp-app --lines 50
```

**Look for errors like:**
- `JWT_SECRET is not set`
- `password authentication failed`
- `relation "users" does not exist`
- `connection refused`

---

## Step 2: Verify Environment Variables

Make sure these are set on your hosting platform:

```env
DB_HOST=72.60.23.73
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=z6hqp3qnmJDD5XW
JWT_SECRET=your_random_secret_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://olpmonitorke.com
PORT=3000
NODE_ENV=production
```

**Most Critical:** `JWT_SECRET` - if missing, login will fail with 500 error!

---

## Step 3: Generate and Set JWT_SECRET

If `JWT_SECRET` is missing:

### Generate Secret:
```bash
openssl rand -base64 32
```

### Add to Environment Variables:
1. Go to hosting platform
2. Environment Variables section
3. Add: `JWT_SECRET` = `<paste_generated_secret>`
4. Save
5. **Restart/Redeploy** application

---

## Step 4: Verify Database Connection

Test if backend can connect to database:

### On Your VPS:
```bash
psql -U grade10_user -d grade10_lms -h localhost
```

If this works, database is accessible.

---

## Step 5: Check if Users Exist

If login fails, you might not have any users:

### On Your VPS:
```bash
cd /var/www/olp
npm run seed
```

This creates default users:
- `headteacher` / `password123`
- `student1` / `password123`
- etc.

---

## Quick Diagnostic

### Test 1: Check Server Logs
What error appears in server logs?

### Test 2: Verify JWT_SECRET
Is `JWT_SECRET` set in environment variables?

### Test 3: Test Database
Can you connect to database from VPS?

### Test 4: Check Users
Do users exist in database?

---

## Most Likely Fix

**90% chance it's missing JWT_SECRET:**

1. Generate: `openssl rand -base64 32`
2. Add to environment variables: `JWT_SECRET=<secret>`
3. Restart server
4. Test login again

---

## Summary

**Status:**
- ✅ API URL fixed
- ✅ Frontend connecting
- ❌ 500 error on login

**Next Steps:**
1. Check server logs for exact error
2. Verify `JWT_SECRET` is set
3. Verify database credentials
4. Restart server after changes

**What error do you see in the server logs?** That will tell us exactly what's wrong! 🔍


