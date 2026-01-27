# Fix Malformed URL Error

## Error
```
Failed to parse URL from httpsolpmonitorke.com://:3000/api/auth/login
```

## Root Causes

1. **Typo in FRONTEND_URL**: `olpmonitorke` should be `olpmonitor`
2. **Old deployment**: Changes not deployed yet
3. **Browser cache**: Old JavaScript cached

---

## Fix Steps

### Step 1: Fix FRONTEND_URL Environment Variable

In your deployment platform settings, make sure it's set correctly:

**CORRECT:**
```
FRONTEND_URL=https://olpmonitorke.com
```

**Important:**
- Use the correct domain: `https://olpmonitorke.com`
- Remove trailing slash: `/` at the end (should be `https://olpmonitorke.com` not `https://olpmonitorke.com/`)

---

### Step 2: Verify Code Changes Are Deployed

Make sure your latest code (with `API_BASE_URL = '/api'`) is deployed:

1. Check if you've committed and pushed the changes:
   ```bash
   git status
   git log -1
   ```

2. If not committed, commit and push:
   ```bash
   git add public/index.html server.js
   git commit -m "Fix API URL to use relative path"
   git push
   ```

3. Trigger a redeploy in your hosting platform

---

### Step 3: Clear Browser Cache

The browser might be using cached JavaScript:

1. **Hard Refresh:**
   - Windows: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **Clear Cache:**
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Or use Incognito/Private Mode:**
   - Test in a new incognito window to bypass cache

---

### Step 4: Verify Environment Variables

Make sure all these are set correctly:

```
DB_HOST=72.60.23.73
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=YourSecurePassword123!
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://olpmonitorke.com
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
```

**Key Points:**
- `FRONTEND_URL` should be `https://olpmonitorke.com` (no trailing slash)
- `DB_HOST` should be `72.60.23.73`

---

## Why This Error Happens

The malformed URL `httpsolpmonitorke.com://:3000` suggests:

1. **Typo in domain**: `olpmonitorke` instead of `olpmonitor`
2. **Missing colon**: `httpsolpmonitorke` instead of `https://olpmonitorke`
3. **Wrong protocol format**: `://:3000` is invalid

This is likely coming from:
- Server-side redirects using `FRONTEND_URL`
- Cached JavaScript trying to construct URLs
- Old deployment with incorrect code

---

## Quick Fix Checklist

- [ ] Fix `FRONTEND_URL` typo: `olpmonitorke` → `olpmonitor`
- [ ] Remove trailing slash from `FRONTEND_URL`
- [ ] Commit and push code changes
- [ ] Redeploy application
- [ ] Clear browser cache (Ctrl+Shift+R)
- [ ] Test in incognito mode
- [ ] Verify all environment variables are correct

---

## Test After Fix

1. Open browser in incognito mode
2. Go to: `https://olpmonitor.com`
3. Open DevTools (F12) → Console
4. Try to login
5. Check for errors

The URL should now be: `/api/auth/login` (relative, no domain)

---

## If Still Not Working

### Check 1: View Source

1. Right-click page → "View Page Source"
2. Search for `API_BASE_URL`
3. Verify it shows: `const API_BASE_URL = '/api';`

If it shows something else, the deployment hasn't updated yet.

### Check 2: Network Tab

1. Open DevTools (F12) → Network tab
2. Try to login
3. Look at the failed request
4. Check the "Request URL" - it should be `/api/auth/login` or `https://olpmonitor.com/api/auth/login`

If it shows the malformed URL, clear cache and redeploy.

---

**The main fix is correcting the FRONTEND_URL typo and ensuring the latest code is deployed!** 🎯

