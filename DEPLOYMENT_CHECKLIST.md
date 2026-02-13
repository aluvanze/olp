# Deployment Checklist - What Needs to Be Done on Server

## ✅ Good News: No Build Required!

Your application is a **Node.js server-side application** that runs directly - no build/compile step needed!

However, you **MUST** do these steps on the server after uploading the code:

---

## Required Steps on Server

### 1. Install Dependencies ✅ CRITICAL

```bash
cd /path/to/your/project
npm install
```

**Why:** This installs all the packages listed in `package.json` (like `pg`, `express`, etc.)

**Without this:** The application won't run - you'll get "Cannot find module" errors.

---

### 2. Create/Configure .env File ✅ CRITICAL

```bash
nano .env
```

Add your configuration:

```env
# Server
PORT=3000
NODE_ENV=production

# Database (pointing to VPS)
DB_HOST=72.60.23.73
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=z6hqp3qnmJDD5XW

# JWT
JWT_SECRET=your_random_secret_here
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=https://olpmonitor.com
```

**Why:** The application needs these environment variables to connect to the database and run properly.

**Without this:** Database connection will fail, authentication won't work.

---

### 3. Run Database Migrations ✅ CRITICAL

```bash
npm run migrate
```

**Why:** This creates all the database tables and schema.

**Without this:** The database will be empty - no tables, no data.

---

### 4. (Optional) Seed Initial Data

```bash
npm run seed
```

**Why:** Creates default users for testing (headteacher, teacher, student, etc.)

**Without this:** You'll need to create users manually.

---

### 5. Start the Server ✅ CRITICAL

```bash
# Option 1: Direct start (for testing)
npm start

# Option 2: With PM2 (recommended for production)
pm2 start server.js --name olp-app
pm2 save
pm2 startup
```

**Why:** The server needs to be running to handle requests.

**Without this:** Frontend will show "Connection error" - server isn't running!

---

## What You DON'T Need to Do

❌ **No build step** - This is not a React/Vue/Angular app that needs compiling  
❌ **No webpack/vite/babel** - It's plain Node.js  
❌ **No transpiling** - JavaScript runs directly  
❌ **No bundling** - Static files are served as-is  

---

## Complete Deployment Steps

### On Your Server (where frontend is hosted):

```bash
# 1. Navigate to project directory
cd /path/to/your/project

# 2. Install dependencies
npm install

# 3. Create .env file (if not exists)
nano .env
# Paste your configuration (see above)

# 4. Run migrations
npm run migrate

# 5. (Optional) Seed data
npm run seed

# 6. Start server
npm start
# OR with PM2:
pm2 start server.js --name olp-app
pm2 save
```

---

## Verify Everything Works

### 1. Check Server is Running

```bash
# Check if process is running
ps aux | grep node
# OR with PM2:
pm2 status
```

### 2. Test API Endpoint

```bash
# Test health endpoint
curl http://localhost:3000/api/health
# OR
curl https://olpmonitor.com/api/health
```

Should return:
```json
{"status":"ok","message":"Senior School OLP API is running"}
```

### 3. Test Database Connection

```bash
# Test from server
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432
```

---

## Common Mistakes

### ❌ Mistake 1: Uploaded code but didn't run `npm install`
**Result:** "Cannot find module 'pg'" errors**
**Fix:** Run `npm install` on the server

### ❌ Mistake 2: Forgot to create `.env` file
**Result:** Database connection fails, JWT errors
**Fix:** Create `.env` file with correct values

### ❌ Mistake 3: Didn't run migrations
**Result:** "relation does not exist" errors
**Fix:** Run `npm run migrate`

### ❌ Mistake 4: Server not running
**Result:** "Connection error" in frontend
**Fix:** Start server with `npm start` or PM2

### ❌ Mistake 5: Wrong API URL in frontend
**Result:** Frontend can't connect to backend
**Fix:** Update `API_BASE_URL` in `public/index.html`

---

## Quick Verification Checklist

After deployment, verify:

- [ ] `npm install` completed successfully
- [ ] `.env` file exists and has correct values
- [ ] `npm run migrate` completed successfully
- [ ] Server is running (`pm2 status` or `ps aux | grep node`)
- [ ] API health endpoint works (`/api/health`)
- [ ] Database connection works (no errors in logs)
- [ ] Frontend can connect (check browser console)

---

## Summary

**What you did:** ✅ Uploaded repository as-is (correct!)

**What needs to be done on server:**
1. ✅ `npm install` - Install dependencies
2. ✅ Create `.env` - Configure environment
3. ✅ `npm run migrate` - Set up database
4. ✅ `npm start` or PM2 - Start server

**No build needed** - This is a direct Node.js application!

---

## If You're Still Getting Connection Errors

1. **Check if server is running:**
   ```bash
   pm2 status
   # OR
   ps aux | grep node
   ```

2. **Check server logs:**
   ```bash
   pm2 logs olp-app
   # OR check the terminal where you ran npm start
   ```

3. **Check database connection:**
   ```bash
   npm run migrate
   # If this fails, database connection is the issue
   ```

4. **Check API URL in frontend:**
   - Open `public/index.html`
   - Check `API_BASE_URL` value
   - Make sure it matches where your server is running

---

**Bottom line:** You uploaded the code correctly, but you need to run the setup steps on the server! 🚀













