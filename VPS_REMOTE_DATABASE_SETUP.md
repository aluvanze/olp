# Remote PostgreSQL Setup: Database on VPS, Frontend Elsewhere

This guide will help you:
1. Set up PostgreSQL on your VPS (72.60.23.73) for remote access
2. Configure your frontend to connect to the remote database
3. Secure the remote database connection

---

## Step 1: On VPS - Configure PostgreSQL for Remote Access

### 1.1 SSH into Your VPS

```bash
ssh root@72.60.23.73
```

### 1.2 Install PostgreSQL (if not already installed)

```bash
apt update
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 1.3 Create Database and User

```bash
sudo -u postgres psql
```

In psql, run:

```sql
CREATE USER grade10_user WITH PASSWORD 'YourSecurePassword123!';
CREATE DATABASE grade10_lms OWNER grade10_user;
GRANT ALL PRIVILEGES ON DATABASE grade10_lms TO grade10_user;
\q
```

### 1.4 Configure PostgreSQL to Accept Remote Connections

Edit PostgreSQL configuration:

```bash
nano /etc/postgresql/*/main/postgresql.conf
```

Find this line (use `Ctrl+W` to search):
```
#listen_addresses = 'localhost'
```

Change it to:
```
listen_addresses = '*'
```

This allows PostgreSQL to listen on all network interfaces.

Save: `Ctrl+X`, then `Y`, then `Enter`

### 1.5 Configure Client Authentication

Edit the authentication file:

```bash
nano /etc/postgresql/*/main/pg_hba.conf
```

Add these lines at the end of the file:

```
# Allow remote connections from any IP (you can restrict this later)
host    grade10_lms    grade10_user    0.0.0.0/0    md5

# Or restrict to specific IP (more secure - replace YOUR_FRONTEND_IP with actual IP)
# host    grade10_lms    grade10_user    YOUR_FRONTEND_IP/32    md5
```

**Security Note:** 
- `0.0.0.0/0` allows connections from any IP (less secure but easier)
- For better security, replace with your frontend server's IP address

Save: `Ctrl+X`, then `Y`, then `Enter`

### 1.6 Restart PostgreSQL

```bash
systemctl restart postgresql
systemctl status postgresql
```

### 1.7 Configure Firewall to Allow PostgreSQL Port

```bash
# Allow PostgreSQL port (5432)
ufw allow 5432/tcp

# Or allow from specific IP (more secure)
# ufw allow from YOUR_FRONTEND_IP to any port 5432 proto tcp

# Enable firewall if not already enabled
ufw enable

# Check status
ufw status
```

---

## Step 2: Test Remote Connection from Your Local Machine

### 2.1 Test Connection (Windows PowerShell)

```powershell
# Install PostgreSQL client tools if needed, or use psql from your local PostgreSQL installation
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432
```

Enter password: `z6hqp3qnmJDD5XW`

If connection works, you'll see:
```
grade10_lms=>
```

Type `\q` to exit.

---

## Step 3: Update Your Frontend .env File

### 3.1 Update Database Connection Settings

On your frontend server (where your application is hosted), update the `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration - POINT TO VPS
DB_HOST=72.60.23.73
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=z6hqp3qnmJDD5XW

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string
JWT_EXPIRES_IN=7d

# Frontend URL (keep your current domain)
FRONTEND_URL=https://olpmonitor.com

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=noreply@olpmonitor.com
```

**Key Changes:**
- `DB_HOST=72.60.23.73` (changed from `localhost` to your VPS IP)
- Keep all other settings the same

### 3.2 Test Database Connection from Frontend

Run migrations to test connection:

```bash
npm run migrate
```

If successful, you'll see:
```
Running migrations...
✓ All migrations completed successfully!
```

---

## Step 4: Security Best Practices (Recommended)

### 4.1 Restrict Database Access by IP (More Secure)

Instead of allowing all IPs, restrict to your frontend server's IP:

1. Find your frontend server's IP address
2. Update `pg_hba.conf`:

```bash
nano /etc/postgresql/*/main/pg_hba.conf
```

Replace:
```
host    grade10_lms    grade10_user    0.0.0.0/0    md5
```

With (replace `YOUR_FRONTEND_IP` with actual IP):
```
host    grade10_lms    grade10_user    YOUR_FRONTEND_IP/32    md5
```

3. Restart PostgreSQL:
```bash
systemctl restart postgresql
```

### 4.2 Update Firewall to Only Allow Frontend IP

```bash
# Remove the open rule
ufw delete allow 5432/tcp

# Add specific IP rule
ufw allow from YOUR_FRONTEND_IP to any port 5432 proto tcp
```

### 4.3 Use Strong Password

Make sure your database password is strong:
- Mix of uppercase, lowercase, numbers, special characters
- At least 16 characters long

---

## Step 5: Verify Everything Works

### 5.1 On VPS - Check PostgreSQL is Listening

```bash
# Check if PostgreSQL is listening on all interfaces
netstat -tulpn | grep 5432
```

You should see:
```
tcp  0  0 0.0.0.0:5432  0.0.0.0:*  LISTEN  ...
```

### 5.2 Test Connection from Frontend Server

From your frontend server, test the connection:

```bash
# If you have psql installed
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432

# Or test with Node.js
node -e "const { Pool } = require('pg'); const pool = new Pool({ host: '72.60.23.73', port: 5432, database: 'grade10_lms', user: 'grade10_user', password: 'z6hqp3qnmJDD5XW' }); pool.query('SELECT NOW()', (err, res) => { if (err) console.error(err); else console.log('Connected!', res.rows); pool.end(); });"
```

### 5.3 Run Migrations from Frontend

```bash
cd /path/to/your/frontend
npm run migrate
```

---

## Troubleshooting

### Connection Refused

**Error:** `Connection refused` or `ECONNREFUSED`

**Solutions:**
1. Check PostgreSQL is running on VPS:
   ```bash
   systemctl status postgresql
   ```

2. Check `listen_addresses` in `postgresql.conf`:
   ```bash
   grep listen_addresses /etc/postgresql/*/main/postgresql.conf
   ```
   Should show: `listen_addresses = '*'`

3. Check firewall:
   ```bash
   ufw status
   ```
   Port 5432 should be allowed

4. Check PostgreSQL is listening:
   ```bash
   netstat -tulpn | grep 5432
   ```

### Authentication Failed

**Error:** `password authentication failed`

**Solutions:**
1. Verify password in `.env` matches VPS database password
2. Check `pg_hba.conf` has correct entry:
   ```bash
   cat /etc/postgresql/*/main/pg_hba.conf | grep grade10
   ```

3. Restart PostgreSQL after changes:
   ```bash
   systemctl restart postgresql
   ```

### Timeout Errors

**Error:** `Connection timeout` or `ETIMEDOUT`

**Solutions:**
1. Check if VPS firewall is blocking:
   ```bash
   ufw status
   ```

2. Check if your hosting provider has a firewall blocking outbound connections
3. Verify VPS IP is correct: `72.60.23.73`
4. Test from VPS itself:
   ```bash
   psql -h localhost -U grade10_user -d grade10_lms
   ```

### SSL/TLS Errors

If you see SSL errors, you can disable SSL requirement (for development) or configure SSL properly.

In `pg_hba.conf`, you can use:
```
host    grade10_lms    grade10_user    0.0.0.0/0    md5
```

Instead of:
```
hostssl    grade10_lms    grade10_user    0.0.0.0/0    md5
```

---

## Quick Reference Commands

### On VPS

```bash
# Check PostgreSQL status
systemctl status postgresql

# Check PostgreSQL is listening
netstat -tulpn | grep 5432

# View PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*.log

# Restart PostgreSQL
systemctl restart postgresql

# Check firewall
ufw status
```

### On Frontend Server

```bash
# Test connection
psql -h 72.60.23.73 -U grade10_user -d grade10_lms -p 5432

# Run migrations
npm run migrate

# Check .env file
cat .env | grep DB_
```

---

## Security Checklist

- [ ] PostgreSQL password is strong
- [ ] `pg_hba.conf` configured for remote access
- [ ] `postgresql.conf` has `listen_addresses = '*'`
- [ ] Firewall allows PostgreSQL port (5432)
- [ ] Consider restricting access to specific IP (more secure)
- [ ] `.env` file has correct VPS IP and credentials
- [ ] Test connection works from frontend
- [ ] Migrations run successfully

---

## Summary

**What Changed:**
- ✅ PostgreSQL runs on VPS (72.60.23.73)
- ✅ PostgreSQL configured for remote access
- ✅ Frontend connects to remote database
- ✅ Frontend remains on current hosting/CDN

**Your Setup:**
- **Frontend:** olpmonitor.com (current hosting)
- **Database:** 72.60.23.73:5432 (VPS)

**Next Steps:**
1. Complete VPS PostgreSQL setup (Step 1)
2. Update frontend `.env` file (Step 3)
3. Test connection (Step 5)
4. Run migrations from frontend

---

**Congratulations!** 🎉 Your database is now on the VPS and your frontend can connect to it remotely!












