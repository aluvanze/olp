# How to Open PostgreSQL

There are two main ways to access PostgreSQL: Command Line (psql) and GUI (pgAdmin).

## Method 1: Command Line (psql) - Recommended

### Step 1: Open PowerShell or Command Prompt
- Press `Win + X` and select "Windows PowerShell" or "Terminal"
- Or search for "PowerShell" in Start menu

### Step 2: Connect to PostgreSQL

**Option A: Connect as postgres user (default)**
```powershell
psql -U postgres
```
(Enter your PostgreSQL password when prompted)

**Option B: If psql is not in PATH, use full path:**
```powershell
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```
(Replace `16` with your PostgreSQL version number)

**Option C: Connect directly to a specific database:**
```powershell
psql -U postgres -d grade10_lms
```

### Step 3: Use psql Commands

Once connected, you'll see `postgres=#` or `grade10_lms=#` prompt.

**Common commands:**
```sql
\l          -- List all databases
\dt         -- List all tables in current database
\d users    -- Show structure of 'users' table
\c grade10_lms  -- Connect to grade10_lms database
SELECT * FROM users;  -- Run SQL query
\q          -- Quit and exit psql
```

**Example session:**
```sql
postgres=# \l                    -- See all databases
postgres=# CREATE DATABASE grade10_lms;  -- Create database
postgres=# \c grade10_lms        -- Switch to database
grade10_lms=# \dt                -- List tables
grade10_lms=# SELECT * FROM users;  -- View users
grade10_lms=# \q                 -- Exit
```

---

## Method 2: pgAdmin (GUI Tool) - Easier for Beginners

### Step 1: Open pgAdmin

1. Search for "pgAdmin" in Start menu
2. Or find it in: Start → PostgreSQL 16 → pgAdmin 4
3. pgAdmin will open in your web browser

### Step 2: Connect to Server

1. In the left panel, expand "Servers"
2. Click on "PostgreSQL 16" (or your version)
3. Enter your PostgreSQL password when prompted
4. Click "OK"

### Step 3: Navigate the Database

**To view databases:**
- Expand: Servers → PostgreSQL 16 → Databases

**To create a new database:**
1. Right-click on "Databases"
2. Select "Create" → "Database..."
3. Name: `grade10_lms`
4. Click "Save"

**To view tables:**
1. Expand: Databases → grade10_lms → Schemas → public → Tables
2. You'll see all tables (users, courses, assignments, etc.)

**To view table data:**
1. Right-click on a table (e.g., "users")
2. Select "View/Edit Data" → "All Rows"
3. You'll see the data in a table format

**To run SQL queries:**
1. Right-click on "grade10_lms" database
2. Select "Query Tool"
3. Type your SQL: `SELECT * FROM users;`
4. Click the "Execute" button (or press F5)

---

## Quick Start: Create the Database

### Using Command Line:
```powershell
psql -U postgres
```
Then:
```sql
CREATE DATABASE grade10_lms;
\q
```

### Using pgAdmin:
1. Right-click "Databases" → Create → Database
2. Name: `grade10_lms`
3. Save

---

## Troubleshooting

### Problem: "psql: command not found"
**Solution:** PostgreSQL bin directory not in PATH
```powershell
# Use full path instead:
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```
(Find your PostgreSQL version folder in Program Files)

### Problem: "password authentication failed"
**Solution:** 
- Make sure you're using the correct password (set during installation)
- If you forgot the password, you may need to reset it

### Problem: "could not connect to server"
**Solution:**
1. Check if PostgreSQL service is running:
   ```powershell
   Get-Service -Name postgresql*
   ```
2. If not running, start it:
   ```powershell
   Start-Service postgresql-x64-*
   ```

### Problem: pgAdmin won't open
**Solution:**
- pgAdmin runs in your browser
- Look for a browser window that opened automatically
- Or go to: http://127.0.0.1:port (check pgAdmin system tray icon)

---

## Recommendation

- **For quick tasks**: Use `psql` command line (faster)
- **For exploring data**: Use pgAdmin (visual, easier)
- **For this project**: Either works fine!

---

## Next Steps After Opening PostgreSQL

1. Create the database: `CREATE DATABASE grade10_lms;`
2. Run migrations: `npm run migrate` (in your project folder)
3. View your data using either method above!

