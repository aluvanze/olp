# PostgreSQL Installation Guide for Grade 10 LMS

## What You Need to Install

### ✅ **REQUIRED: Core PostgreSQL Server Only**

For this Node.js LMS project, you only need:
- **PostgreSQL Server** (the core database)
- That's it!

### ❌ **NOT NEEDED: Stack Builder Components**

You can **skip Stack Builder** or **click Cancel** - you don't need any of these additional components:
- Database Drivers (Npgsql, pgJDBC, psqlODBC) - Not needed for Node.js
- Spatial Extensions - Not required
- Web Development tools - Not needed
- Other add-ons - Not required

## Installation Steps

### Option 1: Skip Stack Builder (Recommended)
1. Click **"Cancel"** in Stack Builder
2. PostgreSQL core is already installed - that's all you need!

### Option 2: If You Continue with Stack Builder
1. Don't check any boxes
2. Click **"Next"** → **"Next"** → **"Finish"** (to skip)
3. Or just close the window

## Why You Don't Need Stack Builder Components

- **Node.js uses `pg` library**: We use the `pg` npm package, not .NET drivers
- **No ODBC/JDBC needed**: These are for other programming languages
- **Keep it simple**: Core PostgreSQL is sufficient

## After Installation

1. **Verify PostgreSQL is installed:**
   ```powershell
   psql --version
   ```

2. **Check PostgreSQL service is running:**
   ```powershell
   Get-Service -Name postgresql*
   ```

3. **Update your `.env` file** with your PostgreSQL password

4. **Create the database:**
   ```powershell
   psql -U postgres
   ```
   Then in psql:
   ```sql
   CREATE DATABASE grade10_lms;
   \q
   ```

5. **Run migrations:**
   ```powershell
   npm run migrate
   ```

## Summary

**What to install:**
- ✅ PostgreSQL Server (core installation - already done if you see Stack Builder)

**What NOT to install:**
- ❌ Stack Builder components (Cancel/Skip it)

The core PostgreSQL installation is complete! You can proceed with setting up the database.

