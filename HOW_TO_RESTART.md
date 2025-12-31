# How to Restart the Server

## Quick Method

### Option 1: Manual Restart
1. **Stop the server:**
   - Find the terminal/command prompt where `npm start` is running
   - Press `Ctrl + C` (hold Ctrl, press C)
   - Wait until it says "Server stopped" or returns to command prompt

2. **Start the server again:**
   ```powershell
   npm start
   ```

### Option 2: Automatic (I'll do it for you)
Just ask me to restart and I'll stop any running processes and start fresh!

## Step-by-Step Guide

### If Server is Running:
1. Look at your terminal/PowerShell window
2. You should see something like:
   ```
   Grade 10 LMS Server running on port 3000
   ```
3. Click in that terminal window
4. Press `Ctrl + C`
5. Wait a few seconds
6. Run: `npm start`

### If Server is NOT Running:
Just run:
```powershell
npm start
```

## Verify Server is Running

After starting, you should see:
```
Grade 10 LMS Server running on port 3000
Environment: development
```

Then test it:
- Open browser: http://localhost:3000
- Or test API: http://localhost:3000/api/health

## Troubleshooting

### "Port already in use" error
This means the server is still running. Stop it first:
1. Press `Ctrl + C` in the terminal
2. Wait 5 seconds
3. Try `npm start` again

### "Cannot find module" error
Install dependencies first:
```powershell
npm install
```

### Server won't start
Check for errors in the terminal output and let me know what you see!

## Quick Commands

```powershell
# Stop server
Ctrl + C

# Start server
npm start

# Start with auto-reload (development)
npm run dev
```

That's it! Simple as that! 🚀

