# Fix: Connection Error - Server Not Running

## Quick Fix Steps

### 1. Hard Refresh Your Browser
The frontend code was updated, but your browser may be using cached files.

**Windows/Linux:**
- Press `Ctrl + Shift + R` or `Ctrl + F5`

**Mac:**
- Press `Cmd + Shift + R`

### 2. Clear Browser Cache
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

Or manually:
- **Chrome/Edge:** Settings → Privacy → Clear browsing data → Cached images and files
- **Firefox:** Settings → Privacy → Clear Data → Cached Web Content

### 3. Verify You're Using the Correct URL
Make sure you're accessing:
```
http://localhost:3000
```

**NOT:**
- `http://localhost:3001` ❌
- `http://127.0.0.1:3000` (might work, but use localhost:3000)
- `https://localhost:3000` ❌ (unless you have SSL configured)

### 4. Check Browser Console
1. Open browser DevTools (F12)
2. Go to "Console" tab
3. Look for any error messages
4. Common errors:
   - `CORS error` → Server CORS configuration issue
   - `Failed to fetch` → Server not running or wrong URL
   - `Network error` → Connection problem

### 5. Verify Server is Running
Open a new terminal and run:
```powershell
# Check if server is running
netstat -ano | findstr :3000

# Test API directly
Invoke-WebRequest -Uri http://localhost:3000/api/health -UseBasicParsing
```

You should see:
- Port 3000 is LISTENING
- API returns: `{"status":"ok","message":"Senior School OLP API is running"}`

---

## What Was Fixed

✅ **Frontend API URL Updated:**
- Changed from: `http://localhost:3001/api`
- Changed to: `http://localhost:3000/api`

✅ **Server Status:**
- Running on port 3000
- CORS configured correctly
- API endpoints responding

---

## Still Not Working?

### Check 1: Server Process
```powershell
Get-Process -Name node | Where-Object {$_.Id -eq 18968}
```

If no process found, restart server:
```powershell
npm start
```

### Check 2: Port Conflict
```powershell
netstat -ano | findstr :3000
```

If port is in use by different process, kill it:
```powershell
taskkill /PID <process_id> /F
```

### Check 3: Browser Console Errors
1. Open DevTools (F12)
2. Console tab
3. Look for specific error messages
4. Share the error with me for further help

### Check 4: Network Tab
1. Open DevTools (F12)
2. Network tab
3. Try to login
4. Look for the `/api/auth/login` request
5. Check:
   - Status code (should be 200 or 401)
   - Request URL (should be `http://localhost:3000/api/auth/login`)
   - Response (should have JSON data)

---

## Expected Behavior

After fixing:
1. ✅ Page loads at `http://localhost:3000`
2. ✅ Login form appears
3. ✅ No connection error on page load
4. ✅ Login attempt shows proper error (invalid credentials) or success

---

## Quick Test

Open browser console (F12) and run:
```javascript
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(data => console.log('✓ Server OK:', data))
  .catch(err => console.error('✗ Server Error:', err));
```

**Expected output:**
```
✓ Server OK: {status: "ok", message: "Senior School OLP API is running"}
```

If you see an error, the server might not be running or there's a network issue.

---

## Summary

**Most likely cause:** Browser cache still using old API URL (port 3001)

**Solution:** Hard refresh (Ctrl+Shift+R) or clear cache

**If still not working:** Check browser console for specific error messages

