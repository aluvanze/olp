# Database Setup Guide - Step by Step

## Step 1: Install PostgreSQL (if not already installed)

### Check if PostgreSQL is installed:
```powershell
psql --version
```

If you see a version number, PostgreSQL is installed. Skip to Step 2.

### If not installed, download and install:
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Choose a password for the `postgres` user (remember this!)
   - Default port is 5432 (keep this unless you have conflicts)
   - Complete the installation

## Step 2: Start PostgreSQL Service

### Check if PostgreSQL service is running:
```powershell
Get-Service -Name postgresql*
```

### If not running, start it:
```powershell
# Replace X-X with your version number (e.g., postgresql-x64-16)
Start-Service postgresql-x64-*
```

Or use Services Manager:
1. Press `Win + R`, type `services.msc`, press Enter
2. Find "postgresql-x64-..." service
3. Right-click → Start

## Step 3: Create the Database

### Option A: Using Command Line (Recommended)

1. Open PowerShell or Command Prompt
2. Connect to PostgreSQL:
```powershell
psql -U postgres
```
(Enter your PostgreSQL password when prompted)

3. Create the database:
```sql
CREATE DATABASE grade10_lms;
```

4. Verify it was created:
```sql
\l
```
(You should see `grade10_lms` in the list)

5. Exit psql:
```sql
\q
```

### Option B: Using pgAdmin (GUI Tool)

1. Open pgAdmin (installed with PostgreSQL)
2. Connect to PostgreSQL server (enter password)
3. Right-click on "Databases" → Create → Database
4. Name: `grade10_lms`
5. Click Save

## Step 4: Configure Environment Variables

1. Create a `.env` file in your project root (if you haven't already)
2. Add these lines (adjust password to match your PostgreSQL password):

```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=noreply@grade10lms.com

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

**Important:** Replace `your_postgres_password_here` with the password you set during PostgreSQL installation!

## Step 5: Run Database Migrations

This will create all the tables and structure:

```powershell
npm run migrate
```

You should see output like:
```
Running migrations...
Executing 001_initial_schema.sql...
✓ 001_initial_schema.sql completed
All migrations completed successfully!
Database setup complete!
```

## Step 6: Seed Initial Data (Optional)

This creates sample users and data:

```powershell
npm run seed
```

You should see:
```
Seeding initial data...
✓ Default users created
✓ Sample course and module created

Default login credentials:
Username: headteacher / Password: password123
Username: deputy / Password: password123
...
```

## Step 7: Verify Database Setup

### View the database using psql:

```powershell
psql -U postgres -d grade10_lms
```

### Check tables:
```sql
\dt
```
(You should see tables like: users, courses, assignments, etc.)

### View users table:
```sql
SELECT id, username, email, role FROM users;
```

### Exit:
```sql
\q
```

### View using pgAdmin:

1. Open pgAdmin
2. Expand: Servers → PostgreSQL → Databases → grade10_lms → Schemas → public → Tables
3. You'll see all the tables (users, courses, modules, etc.)
4. Right-click any table → View/Edit Data → All Rows

## Common Issues and Solutions

### Issue: "psql: command not found"
**Solution:** Add PostgreSQL bin directory to PATH, or use full path:
```powershell
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```
(Replace 16 with your PostgreSQL version)

### Issue: "password authentication failed"
**Solution:** 
- Make sure you're using the correct password (set during installation)
- Check `.env` file has correct password
- Try resetting PostgreSQL password if needed

### Issue: "database already exists"
**Solution:** The database already exists. You can either:
- Use the existing database, or
- Drop and recreate it:
```sql
DROP DATABASE grade10_lms;
CREATE DATABASE grade10_lms;
```

### Issue: "connection refused" or "could not connect"
**Solution:**
1. Check PostgreSQL service is running:
   ```powershell
   Get-Service -Name postgresql*
   ```
2. Check port 5432 is not blocked by firewall
3. Verify DB_HOST and DB_PORT in `.env` file

### Issue: Migration fails
**Solution:**
1. Make sure database exists (Step 3)
2. Check `.env` file has correct credentials
3. Try dropping and recreating database:
   ```sql
   DROP DATABASE grade10_lms;
   CREATE DATABASE grade10_lms;
   ```
4. Run migration again: `npm run migrate`

## Quick Database Commands Reference

### Connect to database:
```powershell
psql -U postgres -d grade10_lms
```

### Useful psql commands:
```sql
\l          -- List all databases
\dt         -- List all tables in current database
\d users    -- Describe users table structure
SELECT * FROM users;  -- View all users
\q          -- Quit psql
```

### View specific data:
```sql
-- View all users
SELECT id, username, email, role FROM users;

-- View all courses
SELECT * FROM courses;

-- View course enrollments
SELECT * FROM course_enrollments;

-- View assignments
SELECT * FROM assignments;
```

## Next Steps

After database is set up:
1. Start the server: `npm start`
2. Open browser: `http://localhost:3000`
3. Login with seeded credentials (if you ran seed)
4. Start using the LMS!

For more details, see:
- `SETUP.md` - Full setup instructions
- `QUICK_START.md` - Quick start guide
- `DATABASE_INFO.md` - Database architecture details

