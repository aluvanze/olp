# Fix Frontend Connection Error

## Problem
Frontend shows: "Connection error. Please check if the server is running."

---

## Step 1: Check Where Your Backend Server is Running

Your setup:
- **Frontend:** olpmonitor.com (current hosting)
- **Database:** 72.60.23.73:5432 (VPS)

**Question:** Where is your Node.js backend server running?
- Option A: On the same server as frontend (olpmonitor.com)
- Option B: On the VPS (72.60.23.73)

---

## Step 2: Fix Based on Your Setup

### Option A: Backend on Same Server as Frontend

If your backend is running on the same server as your frontend:

#### 2.1 Update Frontend API URL

Edit `public/index.html`:

Find this line (around line 60):
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

Change to:
```javascript
// For production - use relative URL or your domain
const API_BASE_URL = '/api';
// OR if your backend is on a different port:
const API_BASE_URL = 'https://olpmonitor.com/api';
```

#### 2.2 Update CORS in server.js

Make sure your `server.js` allows requests from your domain:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'https://olpmonitor.com',
    'http://olpmonitor.com'
  ].filter(Boolean),
  credentials: true
}));
```

#### 2.3 Update .env File

On your frontend server, update `.env`:

```env
# Database points to VPS
DB_HOST=72.60.23.73
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=z6hqp3qnmJDD5XW

# Frontend URL
FRONTEND_URL=https://olpmonitor.com

# Server port
PORT=3000
```

#### 2.4 Start Backend Server

```bash
# Navigate to your project directory
cd /path/to/your/project

# Install dependencies (if not done)
npm install

# Start server
npm start
# OR with PM2:
pm2 start server.js --name olp-backend
```

---

### Option B: Backend on VPS (72.60.23.73)

If your backend is running on the VPS:

#### 2.1 Update Frontend API URL

Edit `public/index.html`:

```javascript
const API_BASE_URL = 'http://72.60.23.73:3000/api';
// OR if you set up a domain for backend:
const API_BASE_URL = 'https://api.olpmonitor.com/api';
```

#### 2.2 Update CORS in server.js (on VPS)

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'https://olpmonitor.com',
    'http://olpmonitor.com'
  ].filter(Boolean),
  credentials: true
}));
```

#### 2.3 Update .env on VPS

```env
# Database is local on VPS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=z6hqp3qnmJDD5XW

# Frontend URL
FRONTEND_URL=https://olpmonitor.com

# Server port
PORT=3000
```

#### 2.4 Start Backend Server on VPS

```bash
ssh root@72.60.23.73
cd /var/www/olp
npm install
npm start
# OR with PM2:
pm2 start server.js --name olp-backend
```

---

## Step 3: Test Database Connection

### Test from Backend Server

```bash
# Test database connection
node -e "const { Pool } = require('pg'); const pool = new Pool({ host: process.env.DB_HOST || '72.60.23.73', port: 5432, database: 'grade10_lms', user: 'grade10_user', password: 'z6hqp3qnmJDD5XW' }); pool.query('SELECT NOW()', (err, res) => { if (err) console.error('Error:', err); else console.log('Connected!', res.rows); pool.end(); });"
```

### Run Migrations

```bash
npm run migrate
```

---

## Step 4: Test API Endpoints

### Test Health Endpoint

From your browser or terminal:

```bash
# If backend on same server as frontend:
curl https://olpmonitor.com/api/health

# If backend on VPS:
curl http://72.60.23.73:3000/api/health
```

Should return:
```json
{"status":"ok","message":"Senior School OLP API is running"}
```

---

## Step 5: Check Browser Console

1. Open your browser
2. Go to: https://olpmonitor.com
3. Press `F12` to open Developer Tools
4. Go to **Console** tab
5. Look for errors like:
   - `Failed to fetch`
   - `CORS error`
   - `Network error`
   - `Connection refused`

---

## Step 6: Common Issues & Fixes

### Issue 1: "Failed to fetch" or CORS Error

**Fix:**
- Update CORS in `server.js` to include your domain
- Make sure backend server is running
- Check if API URL in frontend is correct

### Issue 2: "Connection refused"

**Fix:**
- Backend server is not running
- Start server: `npm start` or `pm2 start server.js`
- Check if port 3000 is accessible

### Issue 3: Database Connection Error

**Fix:**
- Verify `.env` has correct database credentials
- Check if PostgreSQL is running on VPS
- Test database connection (Step 3 above)

### Issue 4: API URL Wrong

**Fix:**
- Update `API_BASE_URL` in `public/index.html`
- Make sure it matches where your backend is running

---

## Quick Diagnostic Checklist

- [ ] Backend server is running (`npm start` or `pm2 status`)
- [ ] Database connection works (`npm run migrate` succeeds)
- [ ] API health endpoint responds (`/api/health`)
- [ ] Frontend API URL is correct (check `public/index.html`)
- [ ] CORS allows your domain (check `server.js`)
- [ ] `.env` file has correct database credentials
- [ ] No errors in browser console (F12 → Console)
- [ ] No errors in server logs

---

## Quick Test Commands

### Test Backend Server

```bash
# Check if server is running
curl http://localhost:3000/api/health
# OR
curl http://72.60.23.73:3000/api/health
```

### Test Database Connection

```bash
# From backend server
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432
```

### Check Server Logs

```bash
# If using PM2
pm2 logs olp-backend

# If using npm start
# Check the terminal where you ran npm start
```

---

## Next Steps

1. **Identify where your backend is running** (same server as frontend OR on VPS)
2. **Update API_BASE_URL** in `public/index.html`
3. **Start backend server** if not running
4. **Test database connection**
5. **Test API health endpoint**
6. **Check browser console** for errors

---

**Which setup do you have?**
- Backend on same server as frontend (olpmonitor.com)?
- Backend on VPS (72.60.23.73)?

Let me know and I'll provide specific steps for your setup!












