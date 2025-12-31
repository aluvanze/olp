# What to Install for Grade 10 LMS

## ✅ Required Software

### 1. **PostgreSQL Database** (Core Only)
- **Status**: You're installing this now!
- **What to do**: Click **Cancel** in Stack Builder (you don't need those extra tools)
- **Why**: You only need the core PostgreSQL server for Node.js

### 2. **Node.js** (Already installed if you have npm)
Check if installed:
```powershell
node --version
npm --version
```
If not installed, download from: https://nodejs.org/

## ❌ NOT Required (You Can Skip)

### Stack Builder Components
- Npgsql (.NET driver) - Not needed for Node.js
- pgJDBC (Java driver) - Not needed
- psqlODBC (ODBC driver) - Not needed
- Spatial Extensions - Not needed
- Web Development tools - Not needed

**You can click Cancel in Stack Builder - the core PostgreSQL is already installed!**

## After PostgreSQL Installation

1. **Skip/Cancel Stack Builder** (you don't need it)

2. **Update `.env` file** with your PostgreSQL password:
   ```
   DB_PASSWORD=your_postgres_password_here
   ```
   (Replace with the password you set during installation)

3. **Create the database:**
   ```powershell
   psql -U postgres
   ```
   Enter your password, then:
   ```sql
   CREATE DATABASE grade10_lms;
   \q
   ```

4. **Install Node.js dependencies:**
   ```powershell
   npm install
   ```

5. **Run database migrations:**
   ```powershell
   npm run migrate
   ```

6. **Seed sample data (optional):**
   ```powershell
   npm run seed
   ```

7. **Start the server:**
   ```powershell
   npm start
   ```

## Quick Checklist

- [ ] PostgreSQL installed (core server only)
- [ ] Stack Builder skipped/cancelled
- [ ] `.env` file updated with PostgreSQL password
- [ ] Database `grade10_lms` created
- [ ] Node.js dependencies installed (`npm install`)
- [ ] Database migrations run (`npm run migrate`)
- [ ] Server started (`npm start`)

That's it! Just PostgreSQL core and Node.js - keep it simple!

