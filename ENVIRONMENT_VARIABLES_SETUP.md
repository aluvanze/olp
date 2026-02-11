# Environment Variables Setup Guide

## Where to Set Environment Variables

You need to set environment variables in **TWO places**:

1. **On your hosting platform** (where backend server runs) - **CRITICAL**
2. **On your VPS** (if running migrations from VPS) - Optional

---

## Required Environment Variables

### For Your Hosting Platform (Backend Server)

Set these in your hosting platform's environment variables section:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration (Pointing to VPS)
DB_HOST=72.60.23.73
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=z6hqp3qnmJDD5XW

# JWT Configuration (CRITICAL - Must be set!)
JWT_SECRET=your_random_secret_string_here
JWT_EXPIRES_IN=7d

# Frontend URL (For CORS)
FRONTEND_URL=https://olpmonitorke.com

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=noreply@olpmonitorke.com
```

---

## Critical Variables Explained

### 1. DB_HOST (Database Location)
```
DB_HOST=72.60.23.73
```
- Points to your VPS where PostgreSQL is running
- **Must match your VPS IP**

### 2. DB_USER and DB_PASSWORD
```
DB_USER=grade10_user
DB_PASSWORD=z6hqp3qnmJDD5XW
```
- Must match what you created on VPS
- **Critical for database connection**

### 3. JWT_SECRET (Authentication)
```
JWT_SECRET=your_random_secret_string_here
```
- **Required for login to work!**
- Generate with: `openssl rand -base64 32`
- Must be set or login will fail with 500 error

### 4. FRONTEND_URL (CORS)
```
FRONTEND_URL=https://olpmonitorke.com
```
- Used for CORS configuration
- Allows your frontend to make API requests
- **Important for security**

---

## How to Set Environment Variables

### On Most Hosting Platforms:

1. **Go to your hosting platform dashboard**
2. **Find "Environment Variables" or "Config Vars" section**
3. **Add each variable:**
   - Key: `DB_HOST`
   - Value: `72.60.23.73`
   - Click "Add" or "Save"
4. **Repeat for all variables**
5. **Restart/Redeploy** your application

### Common Platform Locations:

- **Vercel:** Settings → Environment Variables
- **Netlify:** Site settings → Environment variables
- **Railway:** Variables tab
- **Render:** Environment tab
- **Heroku:** Settings → Config Vars
- **cPanel:** Environment Variables section

---

## Generate JWT_SECRET

### On Your VPS or Local Machine:

```bash
openssl rand -base64 32
```

Copy the output and use it as `JWT_SECRET` value.

**Example output:**
```
K8j3mN9pQ2rT5vX7zA1bC4dE6fG8hI0jK2lM4nO6pQ8rS0tU2vW4xY6zA8bC0dE
```

Use this entire string as your `JWT_SECRET`.

---

## Verify Environment Variables Are Set

### Check on Hosting Platform:

1. Go to environment variables section
2. Verify all variables are listed
3. Check values are correct (no typos)

### Test from Application:

You can add a temporary endpoint to check (remove after testing):

```javascript
// In server.js (temporary - remove after testing)
app.get('/api/debug/env', (req, res) => {
  res.json({
    hasDB_HOST: !!process.env.DB_HOST,
    hasDB_USER: !!process.env.DB_USER,
    hasDB_PASSWORD: !!process.env.DB_PASSWORD,
    hasJWT_SECRET: !!process.env.JWT_SECRET,
    hasFRONTEND_URL: !!process.env.FRONTEND_URL,
    // Don't show actual values for security
  });
});
```

Then visit: `https://olpmonitorke.com/api/debug/env`

All should show `true`.

---

## Environment Variables Checklist

### Required (Must Have):
- [ ] `DB_HOST=72.60.23.73`
- [ ] `DB_PORT=5432`
- [ ] `DB_NAME=grade10_lms`
- [ ] `DB_USER=grade10_user`
- [ ] `DB_PASSWORD=z6hqp3qnmJDD5XW`
- [ ] `JWT_SECRET=<random_string>`
- [ ] `FRONTEND_URL=https://olpmonitorke.com`
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`

### Optional (Nice to Have):
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `EMAIL_HOST=smtp.gmail.com`
- [ ] `EMAIL_PORT=587`
- [ ] `EMAIL_USER=your_email@gmail.com`
- [ ] `EMAIL_PASS=your_app_password`
- [ ] `EMAIL_FROM=noreply@olpmonitorke.com`

---

## Common Issues

### Issue 1: Login Returns 500 Error
**Cause:** `JWT_SECRET` not set  
**Fix:** Add `JWT_SECRET` to environment variables

### Issue 2: Database Connection Failed
**Cause:** Wrong `DB_HOST`, `DB_USER`, or `DB_PASSWORD`  
**Fix:** Verify values match VPS database settings

### Issue 3: CORS Error
**Cause:** `FRONTEND_URL` not set or wrong  
**Fix:** Set `FRONTEND_URL=https://olpmonitorke.com`

### Issue 4: Variables Not Loading
**Cause:** Server not restarted after adding variables  
**Fix:** Restart/redeploy application

---

## Quick Setup Commands

### Generate JWT_SECRET:
```bash
openssl rand -base64 32
```

### Test Database Connection:
```bash
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432
```

---

## Summary

**Environment Variables Needed:**
1. ✅ Database connection (DB_HOST, DB_USER, DB_PASSWORD, etc.)
2. ✅ JWT_SECRET (critical for authentication)
3. ✅ FRONTEND_URL (for CORS)
4. ✅ PORT and NODE_ENV

**Where to Set:**
- On your **hosting platform** (where backend runs)
- NOT in the frontend code (that's hardcoded in index.html)

**After Setting:**
- Restart/redeploy your application
- Test login again

**The most critical one is JWT_SECRET - make sure it's set!** 🔑












