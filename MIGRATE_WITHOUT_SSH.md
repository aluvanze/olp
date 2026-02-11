# Run Migrations Without SSH Access

## Problem
Can't SSH into VPS (connection timeout).

## Solution: Run Migrations from Your Hosting Server

Since you can't access the VPS directly, run migrations from where your application is deployed.

---

## Option 1: Run Migrations from Hosting Platform

### If Your Hosting Platform Has Terminal/SSH Access

1. **Access your hosting platform's terminal/SSH**
2. **Navigate to your project directory**
3. **Run migrations:**

```bash
cd /path/to/your/project
npm run migrate
```

---

## Option 2: Use Database Management Tool

### Option A: pgAdmin (Desktop Tool)

1. **Download pgAdmin:** https://www.pgadmin.org/download/
2. **Add Server:**
   - Host: `72.60.23.73`
   - Port: `5432`
   - Database: `grade10_lms`
   - Username: `grade10_user`
   - Password: `z6hqp3qnmJDD5XW`

3. **Check Tables:**
   - Right-click database → Query Tool
   - Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

4. **Run Migrations:**
   - Open each SQL file from `migrations/` folder
   - Copy and paste into Query Tool
   - Execute

---

### Option B: DBeaver (Free Database Tool)

1. **Download DBeaver:** https://dbeaver.io/download/
2. **Create Connection:**
   - Database: PostgreSQL
   - Host: `72.60.23.73`
   - Port: `5432`
   - Database: `grade10_lms`
   - Username: `grade10_user`
   - Password: `z6hqp3qnmJDD5XW`

3. **Check Tables:**
   - Navigate to Database → Schemas → public → Tables
   - See all tables listed

4. **Run Migrations:**
   - Right-click database → SQL Editor
   - Open migration files and execute

---

### Option C: Online Database Tool (Adminer)

If your hosting platform allows, you can use Adminer:

1. **Upload Adminer** (single PHP file) to your hosting
2. **Access:** `https://olpmonitorke.com/adminer.php`
3. **Login:**
   - System: PostgreSQL
   - Server: `72.60.23.73:5432`
   - Username: `grade10_user`
   - Password: `z6hqp3qnmJDD5XW`
   - Database: `grade10_lms`

4. **Check Tables:** See list on left sidebar
5. **Run SQL:** Use SQL command tab

---

## Option 3: Run Migrations via Your Application

### Create a Migration Endpoint (Temporary)

Add this to your `server.js` temporarily:

```javascript
// TEMPORARY - Remove after migrations are done
app.post('/api/admin/run-migrations', async (req, res) => {
  try {
    const { runMigrations } = require('./migrations/runMigrations');
    await runMigrations();
    res.json({ message: 'Migrations completed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Then call it:
```javascript
fetch('https://olpmonitorke.com/api/admin/run-migrations', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_ADMIN_TOKEN' }
});
```

**⚠️ Remove this endpoint after migrations are done for security!**

---

## Option 4: Check Tables via API

### Create a Check Tables Endpoint

Add to `server.js`:

```javascript
app.get('/api/admin/check-tables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    res.json({ tables: result.rows.map(r => r.table_name) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Then check:
```javascript
fetch('https://olpmonitorke.com/api/admin/check-tables')
  .then(r => r.json())
  .then(console.log);
```

---

## Option 5: Use Your Hosting Platform's Features

### If Using Vercel/Netlify/Railway

Many platforms have:
- **Console/Shell access** - Run commands directly
- **One-click migrations** - Some platforms auto-run migrations
- **Database dashboard** - Built-in database management

Check your hosting platform's documentation for:
- How to run commands
- How to access database
- Migration tools

---

## Quick Check: Do Tables Exist?

### Test via Browser Console

Open https://olpmonitorke.com/ and run in browser console:

```javascript
// Test if users table exists
fetch('/api/users', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(r => r.json())
.then(data => {
  if (r.status === 200) {
    console.log('✅ Tables exist! Users endpoint works');
  } else if (r.status === 500 && data.message.includes('relation')) {
    console.log('❌ Tables missing - need to run migrations');
  }
});
```

---

## Recommended Approach

**Best Option:** Use a database management tool (pgAdmin or DBeaver)

1. **Download pgAdmin or DBeaver**
2. **Connect to:** `72.60.23.73:5432`
3. **Check tables** - See what exists
4. **Run migrations** - Execute SQL files if needed

This is the easiest way without SSH access.

---

## If VPS SSH is Blocked

The connection timeout might be because:
- **Firewall blocking port 22** - Contact VPS provider
- **VPS provider requires web console** - Use their web-based terminal
- **IP whitelist** - Your IP might need to be whitelisted

**Check your VPS provider's dashboard** - they might have:
- Web-based terminal/console
- File manager
- Database management tools

---

## Summary

**Since SSH isn't working:**

1. ✅ **Use database tool** (pgAdmin/DBeaver) - Easiest
2. ✅ **Run from hosting server** - If you have terminal access
3. ✅ **Use hosting platform features** - Check their tools
4. ✅ **Create temporary API endpoint** - For migrations

**Which hosting platform are you using?** I can provide specific steps for your platform! 🚀












