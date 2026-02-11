# Upload Fixed index.html to Hosting Platform

## Problem

Your browser console shows:
```
POST http://localhost:3000/api/auth/login net::ERR_CONNECTION_REFUSED
```

**This means:** The `public/index.html` file on your hosting platform still has the old `localhost:3000` URL.

**Your local file is correct** (`API_BASE_URL = '/api'`), but it needs to be uploaded to hosting.

---

## Solution: Upload the Fixed File

### Option 1: Using SCP (from your local computer)

**On your local Windows computer (PowerShell or Command Prompt):**

```powershell
# Navigate to your project directory
cd C:\Users\JAKE\Documents\olp

# Upload the fixed file
scp public/index.html u224742718@fr-int-web1174.hostinger.com:~/domains/olpmonitorke.com/public_html/public/index.html
```

**Enter your SSH password when prompted.**

---

### Option 2: Using File Manager in Hosting Dashboard

1. **Go to your hosting dashboard** (hPanel)
2. **Open File Manager**
3. **Navigate to:** `domains/olpmonitorke.com/public_html/public/`
4. **Find:** `index.html`
5. **Download it first** (as backup)
6. **Upload your local fixed file:**
   - From: `C:\Users\JAKE\Documents\olp\public\index.html`
   - To: `domains/olpmonitorke.com/public_html/public/index.html`
7. **Replace the existing file**

---

### Option 3: Using Git (if you have Git on hosting)

**On hosting platform SSH:**

```bash
cd ~/domains/olpmonitorke.com/public_html
git pull origin main
# Or
git pull origin master
```

This will pull the latest changes from your repository.

---

### Option 4: Manual Edit via SSH (if upload doesn't work)

**On hosting platform SSH:**

```bash
cd ~/domains/olpmonitorke.com/public_html/public
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

## Verify the Fix

### Step 1: Check the File on Hosting

**On hosting platform SSH:**

```bash
cd ~/domains/olpmonitorke.com/public_html/public
grep "API_BASE_URL" index.html | head -1
```

**Should show:**
```javascript
const API_BASE_URL = '/api';
```

**NOT:**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

---

### Step 2: Clear Browser Cache

1. **Open browser** (Chrome/Firefox)
2. **Press `Ctrl+Shift+Delete`** (or `Cmd+Shift+Delete` on Mac)
3. **Select:** "Cached images and files"
4. **Time range:** "All time"
5. **Click:** "Clear data"

**Or use Incognito/Private mode:**
- Chrome: `Ctrl+Shift+N`
- Firefox: `Ctrl+Shift+P`

---

### Step 3: Test Login

1. **Go to:** https://olpmonitorke.com/
2. **Open browser console:** `F12` → Console tab
3. **Try to login** with: `student1` / `password123`
4. **Check console** - should see:
   - ✅ `POST https://olpmonitorke.com/api/auth/login` (NOT localhost)
   - ✅ Either success or a different error (not `ERR_CONNECTION_REFUSED`)

---

## Expected Results

### ✅ After Fix:
- Console shows: `POST https://olpmonitorke.com/api/auth/login`
- No more `ERR_CONNECTION_REFUSED` error
- Either login works, or you see a different error (like 500 Internal Server Error)

### ❌ If Still Wrong:
- Console still shows: `POST http://localhost:3000/api/auth/login`
- **Solution:** File wasn't replaced, or browser cache issue
- Try: Clear cache, use Incognito, or verify file was uploaded correctly

---

## Quick Checklist

- ✅ Local file is correct (`API_BASE_URL = '/api'`)
- ⏳ Upload fixed file to hosting platform
- ⏳ Verify file on hosting has correct URL
- ⏳ Clear browser cache
- ⏳ Test login

---

## Summary

**Problem:** Hosting platform has old `localhost:3000` URL  
**Fix:** Upload fixed `public/index.html` to hosting  
**Verify:** Check file and clear browser cache  
**Test:** Try login again

**Upload the fixed file and test!** 🚀












