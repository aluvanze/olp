# PostgreSQL Database Locations - Your System

## ✅ PostgreSQL Installation Found

### Installation Location
```
C:\Program Files\PostgreSQL\18
```

### Data Directory (Where databases are stored)
```
C:\Program Files\PostgreSQL\18\data
```

### Binaries (Executables)
```
C:\Program Files\PostgreSQL\18\bin
```

---

## Your Database Configuration

### Current Database Settings (from `.env`)

**Location:** `C:\Users\JAKE\Documents\olp\.env`

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=postgres
DB_PASSWORD=kimoda.098
```

### What This Means:

- **Host:** `localhost` - Connects to PostgreSQL on this computer
- **Port:** `5432` - Standard PostgreSQL port
- **Database:** `grade10_lms` - Your application database
- **User:** `postgres` - PostgreSQL superuser
- **Password:** `kimoda.098` - Your PostgreSQL password

---

## Database File Locations

### Your Database Files

The `grade10_lms` database files are stored in:

```
C:\Program Files\PostgreSQL\18\data\base\<database_oid>\
```

To find the exact folder number (OID), connect to PostgreSQL:

```powershell
# Connect to PostgreSQL
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

# Then run this SQL query:
SELECT oid, datname FROM pg_database WHERE datname = 'grade10_lms';
```

The OID number is the folder name where your database files are stored.

---

## Important PostgreSQL Files

### Configuration Files

1. **postgresql.conf** - Main configuration
   ```
   C:\Program Files\PostgreSQL\18\data\postgresql.conf
   ```

2. **pg_hba.conf** - Authentication/access control
   ```
   C:\Program Files\PostgreSQL\18\data\pg_hba.conf
   ```

### Log Files

```
C:\Program Files\PostgreSQL\18\data\log\
```

---

## Quick Access Commands

### Connect to PostgreSQL

```powershell
# Method 1: Using full path
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

# Method 2: Add to PATH (one-time per session)
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
psql -U postgres

# Method 3: Connect directly to your database
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d grade10_lms
```

### Open pgAdmin (GUI Tool)

```powershell
& "C:\Program Files\PostgreSQL\18\pgAdmin 4\bin\pgAdmin4.exe"
```

Or search for "pgAdmin 4" in Windows Start menu.

---

## Service Information

**Service Name:** `postgresql-x64-18`

**Service Status:** Running ✅

**Service Path:**
```
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" runservice -N "postgresql-x64-18" -D "C:\Program Files\PostgreSQL\18\data"
```

### Manage Service

```powershell
# Check status
Get-Service postgresql-x64-18

# Start service
Start-Service postgresql-x64-18

# Stop service
Stop-Service postgresql-x64-18

# Restart service
Restart-Service postgresql-x64-18
```

---

## Application Connection

### How Your App Connects

**Application Location:**
```
C:\Users\JAKE\Documents\olp
```

**Database Config:**
```
C:\Users\JAKE\Documents\olp\config\database.js
```

**Connection Flow:**
1. Application reads `.env` file
2. Creates connection pool using `config/database.js`
3. Connects to: `localhost:5432`
4. Uses database: `grade10_lms`
5. Authenticates as: `postgres` user

---

## Backup Database Location

If you create backups, they're typically stored in:

```
C:\Users\JAKE\Documents\olp\backups\
```

Or wherever you specify when running:
```sql
pg_dump -U postgres grade10_lms > backup.sql
```

---

## Summary

| Item | Location |
|------|----------|
| **PostgreSQL Installation** | `C:\Program Files\PostgreSQL\18` |
| **Data Directory** | `C:\Program Files\PostgreSQL\18\data` |
| **Binaries** | `C:\Program Files\PostgreSQL\18\bin` |
| **Your Database** | `C:\Program Files\PostgreSQL\18\data\base\<oid>\` |
| **Config File** | `C:\Program Files\PostgreSQL\18\data\postgresql.conf` |
| **Application Config** | `C:\Users\JAKE\Documents\olp\.env` |
| **Database Name** | `grade10_lms` |
| **Connection** | `localhost:5432` |

---

## Quick Reference Commands

```powershell
# Connect to database
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d grade10_lms

# List all databases
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "\l"

# Check database size
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d grade10_lms -c "SELECT pg_size_pretty(pg_database_size('grade10_lms'));"

# Backup database
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres grade10_lms > backup.sql
```

---

**Everything is configured correctly!** Your application connects to PostgreSQL at `localhost:5432` using the database `grade10_lms`.


