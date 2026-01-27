# Fix VPS API URL - Update index.html

## Problem

Your browser console shows:
```
localhost:3000/api/auth/login: Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**This means:** The `public/index.html` file on your VPS still has `localhost:3000` instead of `/api`.

**Your local file is correct** (`API_BASE_URL = '/api'`), but the VPS has the old version.

---

## Step 1: Check Current File on VPS

**On VPS, check the file:**

```bash
cd /var/www/olp/public
grep "API_BASE_URL" index.html | head -1
```

**If it shows:**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**It needs to be fixed!**

---

## Step 2: Fix the File on VPS

### Option A: Edit via SSH (Quick Fix)

**On VPS:**
```bash
cd /var/www/olp/public
nano index.html
```

**Find this line (around line 61):**

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**Change it to:**
```javascript
const API_BASE_URL = '/api';
```

**Save:** `Ctrl+X`, `Y`, `Enter`

---

### Option B: Upload Fixed File from Local Computer

**On your local Windows computer (PowerShell):**

```powershell
cd C:\Users\JAKE\Documents\olp
scp public/index.html root@72.60.23.73:/var/www/olp/public/index.html
```

**Enter your SSH password when prompted.**

**This will replace the file on VPS with your local fixed file.**

---

### Option C: Use Git (if using Git on VPS)

**On VPS:**
```bash
cd /var/www/olp
git pull origin main
# Or
git pull origin master
```

**This will pull the latest changes from your repository.**

---

## Step 3: Verify the Fix

**On VPS:**
```bash
cd /var/www/olp/public
grep "API_BASE_URL" index.html | head -1
```

**Should now show:**
```javascript
const API_BASE_URL = '/api';
```

**NOT:**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

---

## Step 4: Verify Application is Running

**On VPS:**
```bash
pm2 status
```

**Should show:**
```
┌─────┬─────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name        │ mode        │ ↺       │ status  │ cpu      │
├─────┼─────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ olp-app     │ fork        │ 0       │ online  │ 0%       │
└─────┴─────────────┴─────────────┴─────────┴─────────┴──────────┘
```

**If not running:**
```bash
cd /var/www/olp
pm2 start server.js --name olp-app
pm2 save
```

---

## Step 5: Check Nginx Configuration

**On VPS:**
```bash
cat /etc/nginx/sites-available/olpmonitorke.com | grep -A 10 "location /api"
```

**Should show:**
```nginx
location /api {
    proxy_pass http://localhost:3000;
    ...
}
```

**If missing, add it:**

```bash
nano /etc/nginx/sites-available/olpmonitorke.com
```

**Add this inside the server block:**
```nginx
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
```

**Save:** `Ctrl+X`, `Y`, `Enter`

**Test and reload:**
```bash
nginx -t
systemctl restart nginx
```

---

## Step 6: Clear Browser Cache

**On your local computer:**

1. **Open browser** (Chrome/Firefox)
2. **Press `Ctrl+Shift+Delete`** (or `Cmd+Shift+Delete` on Mac)
3. **Select:** "Cached images and files"
4. **Time range:** "All time"
5. **Click:** "Clear data"

**Or use Incognito/Private mode:**
- Chrome: `Ctrl+Shift+N`
- Firefox: `Ctrl+Shift+P`

---

## Step 7: Test Login

1. **Go to:** http://72.60.23.73/ (or your domain)
2. **Open browser console:** `F12` → Console tab
3. **Try to login** with: `student1` / `password123`
4. **Check console** - should see:
   - ✅ `POST http://72.60.23.73/api/auth/login` (NOT localhost)
   - ✅ Either success or a different error (not `ERR_CONNECTION_REFUSED`)

---

## Expected Results

### ✅ After Fix:
- Console shows: `POST http://72.60.23.73/api/auth/login`
- No more `ERR_CONNECTION_REFUSED` error
- Either login works, or you see a different error (like 500 Internal Server Error)

### ❌ If Still Wrong:
- Console still shows: `POST http://localhost:3000/api/auth/login`
- **Solution:** File wasn't replaced, or browser cache issue
- Try: Clear cache, use Incognito, or verify file was updated correctly

---

## Quick Checklist

- ✅ Local file is correct (`API_BASE_URL = '/api'`)
- ⏳ Fix file on VPS
- ⏳ Verify file on VPS has correct URL
- ⏳ Verify PM2 is running
- ⏳ Verify Nginx is configured
- ⏳ Clear browser cache
- ⏳ Test login

---

## Summary

**Problem:** VPS has old `localhost:3000` URL  
**Fix:** Update `public/index.html` on VPS to use `/api`  
**Verify:** Check file, PM2, Nginx  
**Test:** Clear cache and try login

**Fix the file on VPS and test again!** 🚀


