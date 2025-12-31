# Quick Fix: Database Password

## The Problem
Your `.env` file has the wrong PostgreSQL password.

## Quick Solution

### Step 1: Test Your PostgreSQL Password
Open PowerShell and test if you can connect:
```powershell
psql -U postgres
```
- If it asks for a password and accepts it → Your password works!
- If it rejects the password → You need to find/reset your password

### Step 2: Update .env File

1. **Open the file:**
   ```
   C:\Users\JAKE\Documents\olp\.env
   ```

2. **Find this line:**
   ```
   DB_PASSWORD=your_postgres_password_here
   ```
   (or whatever is currently there)

3. **Replace it with your actual PostgreSQL password:**
   ```
   DB_PASSWORD=your_actual_password_here
   ```
   - Use the EXACT password you use when running `psql -U postgres`
   - No quotes, no spaces
   - Case-sensitive

4. **Save the file**

### Step 3: Test the Connection
```powershell
node test-db-connection.js
```

If you see "✅ SUCCESS!" → Password is correct!

### Step 4: Run Setup
Once password is correct:
```powershell
npm run migrate
npm run seed
npm start
```

## Common Mistakes

❌ **Wrong:**
```
DB_PASSWORD="mypassword"
DB_PASSWORD= mypassword
DB_PASSWORD=mypassword123  (if your actual password is different)
```

✅ **Correct:**
```
DB_PASSWORD=mypassword123
```
(Exactly as you type it in psql)

## If You Forgot Your Password

You have a few options:

1. **Try common passwords you might have used**
2. **Reset PostgreSQL password** (requires admin access)
3. **Reinstall PostgreSQL** with a new password you'll remember

## Need Help?

After updating the password, run:
```powershell
node test-db-connection.js
```

This will tell you if the connection works!

