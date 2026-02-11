# Deploy the Fix - Step by Step

## ✅ Your Local Files Are Fixed!

The files on your computer are correct:
- `public/index.html` - Line 61: `const API_BASE_URL = '/api';` ✅
- `server.js` - Updated ✅

## ❌ But Your Deployed Site Still Has Old Code!

The error shows: `POST http://localhost:3000/api/auth/login`

This means the deployed version still has the old code.

---

## How to Deploy the Fix

### Option 1: If Using Git/GitHub (Recommended)

1. **Open terminal/PowerShell in your project folder:**
   ```powershell
   cd C:\Users\JAKE\Documents\olp
   ```

2. **Check what files changed:**
   ```powershell
   git status
   ```

3. **Add the changed files:**
   ```powershell
   git add public/index.html server.js
   ```

4. **Commit the changes:**
   ```powershell
   git commit -m "Fix API URL to use relative path for production"
   ```

5. **Push to GitHub:**
   ```powershell
   git push
   ```

6. **Your hosting platform should auto-deploy**, or manually trigger a redeploy.

---

### Option 2: If Uploading Files Directly

1. **Go to your hosting platform's file manager or FTP**

2. **Upload/Replace these files:**
   - `public/index.html` (most important!)
   - `server.js` (optional but recommended)

3. **Make sure to replace the old files**, not create duplicates

4. **Restart/Redeploy your application**

---

### Option 3: If Using a Deployment Platform (Vercel, Netlify, etc.)

1. **Connect your GitHub repository** (if not already connected)

2. **Push the changes:**
   ```powershell
   git add public/index.html server.js
   git commit -m "Fix API URL"
   git push
   ```

3. **The platform should auto-deploy**, or click "Redeploy" in dashboard

---

## Verify After Deployment

### Step 1: Wait 1-2 minutes for deployment to complete

### Step 2: Clear Browser Cache
- Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or use Incognito/Private window

### Step 3: Check Deployed Code
1. Go to: https://olpmonitorke.com/
2. Right-click → "View Page Source"
3. Press `Ctrl + F` and search for: `API_BASE_URL`
4. **Should show:** `const API_BASE_URL = '/api';`
5. **Should NOT show:** `http://localhost:3000/api`

### Step 4: Test Login
1. Go to: https://olpmonitorke.com/
2. Open DevTools (F12) → Console tab
3. Try to login
4. **Should NOT see:** `ERR_CONNECTION_REFUSED` or `localhost:3000`
5. **Should see:** Request going to `/api/auth/login` or `https://olpmonitorke.com/api/auth/login`

---

## Quick Checklist

- [ ] Files fixed locally (`public/index.html` line 61 = `'/api'`)
- [ ] Files committed and pushed (if using Git)
- [ ] Files uploaded to hosting (if direct upload)
- [ ] Application redeployed/restarted
- [ ] Waited 1-2 minutes for deployment
- [ ] Cleared browser cache
- [ ] Verified deployed code (View Page Source)
- [ ] Tested login (no more localhost:3000 errors)

---

## If Still Not Working After Deployment

### Check 1: Deployment Actually Happened
- Check deployment logs in your hosting platform
- Verify the deployment completed successfully
- Check the deployment timestamp (should be recent)

### Check 2: File Was Actually Updated
- View page source at https://olpmonitorke.com/
- Search for `API_BASE_URL`
- If it still shows `localhost:3000`, the file wasn't updated

### Check 3: Browser Cache
- Try in Incognito/Private window
- Or clear all browser cache and cookies
- Or try a different browser

### Check 4: CDN Cache
- Some hosting platforms use CDN
- CDN might cache old files
- May need to purge CDN cache in hosting dashboard

---

## The Main File to Deploy

**Most Important:** `public/index.html`

This is the file that needs to be updated. Line 61 should have:
```javascript
const API_BASE_URL = '/api';
```

---

## Summary

**Problem:** Deployed site has old code (`localhost:3000`)  
**Solution:** Deploy the updated `public/index.html` file  
**Result:** After deployment, login will work! ✅

**Just deploy the fixed file and you're done!** 🚀












