# Files to Upload for Sub-strands Management Feature

## Error: "Route not found"

This error occurs because the updated files haven't been uploaded to your production server yet.

---

## Files You Need to Upload

### 1. **Backend Route File** (CRITICAL)
**File:** `routes/substrands.js`  
**Location on VPS:** `/var/www/olp/routes/substrands.js`

**Why:** This file contains the new `/api/substrands/learning-areas` endpoint that the frontend is trying to call.

---

### 2. **Frontend File** (CRITICAL)
**File:** `public/index.html`  
**Location on VPS:** `/var/www/olp/public/index.html`

**Why:** This file contains the new "Manage Sub-strands" UI and JavaScript functions.

---

### 3. **Server File** (May already be updated)
**File:** `server.js`  
**Location on VPS:** `/var/www/olp/server.js`

**Why:** This file registers the substrands routes. Check if line 19 and 102 exist:
- Line 19: `const substrandRoutes = require('./routes/substrands');`
- Line 102: `app.use('/api/substrands', substrandRoutes);`

---

## How to Upload Files

### Option 1: Using SCP (Recommended)

**From your local computer (PowerShell):**

```powershell
# Navigate to your project folder
cd C:\Users\JAKE\Documents\olp

# Upload the route file
scp routes/substrands.js root@72.60.23.73:/var/www/olp/routes/

# Upload the frontend file
scp public/index.html root@72.60.23.73:/var/www/olp/public/

# Upload server.js (if needed)
scp server.js root@72.60.23.73:/var/www/olp/
```

---

### Option 2: Using Git (If using Git)

**On VPS:**
```bash
ssh root@72.60.23.73
cd /var/www/olp
git pull origin main
# or
git pull origin master
```

---

### Option 3: Manual Copy-Paste via SSH

**On VPS:**
```bash
ssh root@72.60.23.73
cd /var/www/olp/routes
nano substrands.js
# Paste the updated content, save with Ctrl+X, Y, Enter

cd /var/www/olp/public
nano index.html
# Paste the updated content, save with Ctrl+X, Y, Enter
```

---

## After Uploading Files

### Step 1: Restart the Server
```bash
ssh root@72.60.23.73
cd /var/www/olp
pm2 restart olp-app
```

### Step 2: Verify Server Restarted
```bash
pm2 status
pm2 logs olp-app --lines 20
```

### Step 3: Test the Route
```bash
# Test if the route exists (should return JSON, not "Route not found")
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/substrands/learning-areas
```

---

## Quick Checklist

- [ ] Upload `routes/substrands.js` to `/var/www/olp/routes/`
- [ ] Upload `public/index.html` to `/var/www/olp/public/`
- [ ] Verify `server.js` has substrands route registered (lines 19 and 102)
- [ ] Restart server: `pm2 restart olp-app`
- [ ] Check logs: `pm2 logs olp-app`
- [ ] Clear browser cache (Ctrl+Shift+R)
- [ ] Test the "Manage Sub-strands" page

---

## Verify Files Are Updated

**On VPS, check if the new endpoint exists:**
```bash
cd /var/www/olp/routes
grep -n "learning-areas" substrands.js
```

**Should show:**
```
9:router.get('/learning-areas',
```

**If it doesn't show, the file wasn't uploaded correctly.**

---

## Most Common Issue

**The error "Route not found" usually means:**
1. ✅ Files weren't uploaded to production
2. ✅ Server wasn't restarted after upload
3. ✅ Browser cache is showing old code

**Fix:**
1. Upload the files (especially `routes/substrands.js`)
2. Restart server: `pm2 restart olp-app`
3. Clear browser cache or use Incognito mode

---

## Summary

**Minimum files to upload:**
1. `routes/substrands.js` ← **MOST IMPORTANT**
2. `public/index.html` ← **ALSO IMPORTANT**

**Then restart:**
```bash
pm2 restart olp-app
```

That's it! 🚀












