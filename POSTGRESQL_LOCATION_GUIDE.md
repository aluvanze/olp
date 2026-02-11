# PostgreSQL Database Location Guide

## Current PostgreSQL Status

✅ **PostgreSQL is installed and running:**
- Service: `postgresql-x64-18 - PostgreSQL Server 18`
- Status: Running

---

## PostgreSQL Installation Locations

### Default Installation Paths (Windows)

PostgreSQL is typically installed in one of these locations:

1. **Program Files (64-bit):**
   ```
   C:\Program Files\PostgreSQL\18
   ```

2. **Program Files (32-bit):**
   ```
   C:\Program Files (x86)\PostgreSQL\18
   ```

### Data Directory Location

The database data files are stored in:

```
C:\Program Files\PostgreSQL\18\data
```

Or check the registry:
```
HKEY_LOCAL_MACHINE\SOFTWARE\PostgreSQL\Installations\postgresql-x64-18
```

---

## Database Connection Configuration

### Current Application Settings

Your application connects to PostgreSQL using these settings (configured in `.env` file):

**Location:** `C:\Users\JAKE\Documents\olp\.env`

```env
DB_HOST=localhost          # PostgreSQL server address
DB_PORT=5432              # PostgreSQL port (default)
DB_NAME=grade10_lms       # Your database name
DB_USER=postgres          # PostgreSQL user
DB_PASSWORD=your_password # Your PostgreSQL password
```

### Configuration File Location

**Database connection config:** `C:\Users\JAKE\Documents\olp\config\database.js`

This file reads from `.env` and creates the connection pool.

---

## Finding PostgreSQL Installation

### Method 1: Check Registry

```powershell
Get-ItemProperty "HKLM:\SOFTWARE\PostgreSQL\Installations\*" | Select-Object PSChildName, BaseDirectory, DataDirectory
```

### Method 2: Check Common Paths

```powershell
# Check Program Files
Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue
Get-ChildItem "C:\Program Files (x86)\PostgreSQL" -ErrorAction SilentlyContinue
```

### Method 3: Check Service

```powershell
Get-WmiObject Win32_Service | Where-Object {$_.Name -like "postgresql*"} | Select-Object Name, PathName
```

### Method 4: Find psql.exe

```powershell
Get-ChildItem -Path "C:\Program Files" -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object FullName
```

---

## Database Data Location

### Default Data Directory

PostgreSQL stores all database files in the **data directory**:

```
C:\Program Files\PostgreSQL\18\data
```

This directory contains:
- `base/` - Database files
- `global/` - System tables
- `pg_wal/` - Write-ahead log
- `postgresql.conf` - Configuration file
- `pg_hba.conf` - Authentication configuration

### Finding Your Data Directory

**Option 1: Check PostgreSQL Config**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Run this query
SHOW data_directory;
```

**Option 2: Check postgresql.conf**
```powershell
# Find and read the config file
Get-Content "C:\Program Files\PostgreSQL\18\data\postgresql.conf" | Select-String "data_directory"
```

**Option 3: Check Service Properties**
1. Open Services (`services.msc`)
2. Find "postgresql-x64-18"
3. Right-click → Properties
4. Check "Path to executable" - data directory is usually in the same parent folder

---

## Your Database Location

### Database Name: `grade10_lms`

This database is stored in:
```
C:\Program Files\PostgreSQL\18\data\base\<database_oid>
```

The exact folder number (OID) can be found by:
```sql
SELECT oid, datname FROM pg_database WHERE datname = 'grade10_lms';
```

---

## Changing Database Location

### Option 1: Move Data Directory (Advanced)

⚠️ **Warning:** This requires stopping PostgreSQL and moving files.

1. **Stop PostgreSQL service:**
   ```powershell
   Stop-Service postgresql-x64-18
   ```

2. **Move data directory** to new location

3. **Update postgresql.conf:**
   ```conf
   data_directory = 'D:\PostgreSQL\data'
   ```

4. **Start service:**
   ```powershell
   Start-Service postgresql-x64-18
   ```

### Option 2: Use Different Host/Port

If you want to connect to a remote PostgreSQL server, update `.env`:

```env
DB_HOST=192.168.1.100    # Remote server IP
DB_PORT=5432              # Remote port
DB_NAME=grade10_lms
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## Quick Commands

### Check PostgreSQL Version
```powershell
# If psql is in PATH
psql --version

# Or check service
Get-Service postgresql* | Select-Object Name, DisplayName
```

### Connect to PostgreSQL
```powershell
# Using full path (if not in PATH)
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

# Or add to PATH first
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
psql -U postgres
```

### List All Databases
```sql
-- After connecting with psql
\l
```

### Check Current Database
```sql
SELECT current_database();
```

### Find Database Files
```sql
SELECT pg_database.datname, pg_database.oid 
FROM pg_database 
WHERE datname = 'grade10_lms';
```

Then check:
```
C:\Program Files\PostgreSQL\18\data\base\<oid>
```

---

## Application Database Configuration

### Current Setup

**Project Location:**
```
C:\Users\JAKE\Documents\olp
```

**Database Config File:**
```
C:\Users\JAKE\Documents\olp\config\database.js
```

**Environment Variables:**
```
C:\Users\JAKE\Documents\olp\.env
```

**Database Connection:**
- Host: `localhost` (connects to local PostgreSQL)
- Port: `5432` (default PostgreSQL port)
- Database: `grade10_lms`
- User: `postgres`

---

## Verifying Database Connection

### Test Connection from Application

```powershell
# From your project directory
node -e "require('dotenv').config(); const {pool} = require('./config/database'); pool.query('SELECT NOW()', (err, res) => { if(err) console.error(err); else console.log('Connected!', res.rows[0]); pool.end(); });"
```

### Test Connection with psql

```powershell
# Connect to your database
psql -U postgres -d grade10_lms

# Or if psql is not in PATH
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d grade10_lms
```

---

## Summary

✅ **PostgreSQL Service:** Running (postgresql-x64-18)

✅ **Default Installation:** 
   - `C:\Program Files\PostgreSQL\18\` (or similar)

✅ **Data Directory:**
   - `C:\Program Files\PostgreSQL\18\data\`

✅ **Your Database:** `grade10_lms`
   - Stored in: `data\base\<database_oid>\`

✅ **Application Config:**
   - Location: `C:\Users\JAKE\Documents\olp\.env`
   - Connects to: `localhost:5432`

---

## Need to Find Exact Location?

Run this command to find PostgreSQL installation:

```powershell
Get-ItemProperty "HKLM:\SOFTWARE\PostgreSQL\Installations\*" | Format-List PSChildName, BaseDirectory, DataDirectory
```

Or check the service:

```powershell
Get-WmiObject Win32_Service | Where-Object {$_.Name -like "postgresql*"} | Format-List Name, PathName, State
```

