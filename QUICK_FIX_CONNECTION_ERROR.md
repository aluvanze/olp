# Quick Fix: Connection Error

## ✅ Server Status: RUNNING

- **Port:** 3000 ✅
- **API Health:** Responding ✅  
- **CORS:** Configured ✅
- **API URL:** `http://localhost:3000/api` ✅

---

## 🔧 Quick Fix Steps

### Step 1: Hard Refresh Browser

**Windows/Linux:**
```
Ctrl + Shift + R
```
or
```
Ctrl + F5
```

**Mac:**
```
Cmd + Shift + R
```

### Step 2: Clear Browser Cache

**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Right-click the **refresh button** (next to address bar)
3. Select **"Empty Cache and Hard Reload"**

**Firefox:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached Web Content"
3. Click "Clear Now"

### Step 3: Verify URL

Make sure you're accessing:
```
http://localhost:3000
```

**NOT:**
- ❌ `http://localhost:3001`
- ❌ `https://localhost:3000`
- ❌ `http://127.0.0.1:3000` (might work, but use localhost)

### Step 4: Check Browser Console

1. Open DevTools: Press `F12`
2. Go to **Console** tab
3. Look for errors
4. Try to login again
5. Check **Network** tab for failed requests

---

## 🧪 Test Connection

Open browser console (F12) and run:

```javascript
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Server OK:', data);
    alert('Server is working!');
  })
  .catch(err => {
    console.error('❌ Error:', err);
    alert('Connection failed: ' + err.message);
  });
```

**Expected:** Should show `{status: "ok", message: "Senior School OLP API is running"}`

---

## 🔍 Common Issues

### Issue 1: Browser Cache
**Symptom:** Old code still running  
**Fix:** Hard refresh (Ctrl+Shift+R) or clear cache

### Issue 2: Wrong Port
**Symptom:** Connection refused  
**Fix:** Make sure URL is `http://localhost:3000`

### Issue 3: CORS Error
**Symptom:** "CORS policy" error in console  
**Fix:** Already configured - try hard refresh

### Issue 4: Server Not Running
**Symptom:** Connection refused  
**Fix:** Run `npm start` in project directory

---

## ✅ Verification Checklist

- [ ] Server is running (check: `netstat -ano | findstr :3000`)
- [ ] API responds (test: `http://localhost:3000/api/health`)
- [ ] Browser URL is `http://localhost:3000`
- [ ] Hard refresh done (Ctrl+Shift+R)
- [ ] Browser cache cleared
- [ ] No errors in browser console

---

## 🚀 If Still Not Working

1. **Close all browser tabs** with localhost:3000
2. **Close browser completely**
3. **Reopen browser**
4. **Navigate to:** `http://localhost:3000`
5. **Try again**

---

## 📝 Server Restart (if needed)

If you need to restart the server:

```powershell
# Stop server (find process and kill it)
Get-Process -Name node | Stop-Process -Force

# Start server
npm start
```

---

**The server is running correctly!** The issue is most likely browser cache. Try the hard refresh first.

