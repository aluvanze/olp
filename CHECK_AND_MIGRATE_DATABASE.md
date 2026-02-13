# Check Tables & Run Migrations

## Step 1: Check if Tables Exist

### Option A: Check from VPS (Direct Database Access)

SSH into your VPS:

```bash
ssh root@72.60.23.73
```

Connect to PostgreSQL:

```bash
psql -U grade10_user -d grade10_lms -h localhost
```

Enter password when prompted: `z6hqp3qnmJDD5XW`

**List all tables:**
```sql
\dt
```

**List all tables with details:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Check specific table exists:**
```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'users'
);
```

**Exit psql:**
```sql
\q
```

---

### Option B: Check from Your Hosting Server

If you have SSH/terminal access to your hosting server:

```bash
# Test database connection
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432

# Enter password: z6hqp3qnmJDD5XW

# Then list tables
\dt
```

---

### Option C: Check via Node.js Script

Create a file `check-tables.js`:

```javascript
const { pool } = require('./config/database');

async function checkTables() {
  try {
    // List all tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Tables in database:');
    console.log('===================');
    
    if (result.rows.length === 0) {
      console.log('❌ No tables found! You need to run migrations.');
    } else {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
      console.log(`\n✅ Total: ${result.rows.length} tables`);
    }
    
    // Check for key tables
    const keyTables = ['users', 'courses', 'assignments', 'grades'];
    console.log('\n🔍 Checking key tables:');
    console.log('===================');
    
    for (const table of keyTables) {
      const check = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      const exists = check.rows[0].exists;
      console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    process.exit(1);
  }
}

checkTables();
```

Run it:
```bash
node check-tables.js
```

---

## Step 2: Run Migrations

### Option A: Run from Hosting Server (Recommended)

If your application code is on your hosting server:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Run migrations
npm run migrate
```

You should see output like:
```
Running migrations...
Executing 001_initial_schema.sql...
✓ 001_initial_schema.sql completed
Executing 002_add_superadmin_and_permissions.sql...
✓ 002_add_superadmin_and_permissions.sql completed
...
All migrations completed successfully!
Database setup complete!
```

---

### Option B: Run from VPS

If you uploaded your code to VPS:

```bash
ssh root@72.60.23.73
cd /var/www/olp  # or wherever your code is

# Make sure .env file is configured
cat .env | grep DB_

# Run migrations
npm run migrate
```

---

### Option C: Run Individual Migration Files

If you need to run a specific migration:

```bash
# Connect to database
psql -U grade10_user -d grade10_lms -h 72.60.23.73 -p 5432

# Run SQL file
\i migrations/001_initial_schema.sql
\i migrations/002_add_superadmin_and_permissions.sql
# etc.
```

---

## Step 3: Verify Migrations Succeeded

After running migrations, verify:

### Check Tables Exist

```bash
psql -U grade10_user -d grade10_lms -h 72.60.23.73 -p 5432

# List tables
\dt

# Should show tables like:
# users
# courses
# assignments
# assignments
# etc.
```

### Check Table Structure

```sql
-- Check users table structure
\d users

-- Check if users table has data
SELECT COUNT(*) FROM users;

-- Check specific columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

---

## Step 4: Seed Initial Data (Optional)

After migrations, you can seed sample data:

```bash
# From your project directory
npm run seed
```

This creates default users:
- `headteacher` / `password123`
- `deputy` / `password123`
- `teacher1` / `password123`
- `student1` / `password123`
- `parent1` / `password123`

**Important:** Change these passwords after first login!

---

## Quick Commands Reference

### Check Tables
```bash
# From VPS
psql -U grade10_user -d grade10_lms -h localhost
\dt

# From hosting server
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432
\dt
```

### Run Migrations
```bash
npm run migrate
```

### Check Specific Table
```sql
SELECT * FROM users LIMIT 1;
SELECT * FROM courses LIMIT 1;
```

### Count Records
```sql
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM courses) as courses,
  (SELECT COUNT(*) FROM assignments) as assignments;
```

---

## Troubleshooting

### Error: "relation does not exist"
**Cause:** Tables haven't been created yet  
**Fix:** Run `npm run migrate`

### Error: "migration already applied"
**Cause:** Migrations were already run  
**Fix:** This is OK - tables already exist

### Error: "permission denied"
**Cause:** Database user doesn't have permissions  
**Fix:** Make sure `grade10_user` has all privileges:
```sql
GRANT ALL PRIVILEGES ON DATABASE grade10_lms TO grade10_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO grade10_user;
```

### Error: "connection refused"
**Cause:** Can't connect to database  
**Fix:** 
- Check `DB_HOST=72.60.23.73` is set
- Check PostgreSQL is running on VPS
- Check firewall allows port 5432

---

## Expected Tables After Migration

After running all migrations, you should have tables like:

- `users` - User accounts
- `courses` - Courses/subjects
- `course_enrollments` - Student enrollments
- `assignments` - Assignments
- `assignment_submissions` - Student submissions
- `grades` - Grades
- `attendance` - Attendance records
- `modules` - Learning modules
- `terms` - Academic terms
- `grade_levels` - Grade levels
- And more...

---

## Summary

1. **Check tables:** `psql -U grade10_user -d grade10_lms -h 72.60.23.73 -p 5432` then `\dt`
2. **Run migrations:** `npm run migrate`
3. **Verify:** Check tables exist with `\dt`
4. **Seed data (optional):** `npm run seed`

**Run migrations from wherever your application code is deployed!** 🚀













