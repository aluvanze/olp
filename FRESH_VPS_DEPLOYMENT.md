# Fresh VPS Deployment - Complete Guide

## Goal
Deploy the entire system (Node.js app + PostgreSQL database) on the VPS.

---

## Step 1: Reset/Clean VPS

### SSH into VPS
```bash
ssh root@72.60.23.73
```

### Stop and Remove Existing PostgreSQL (if any)
```bash
systemctl stop postgresql
apt remove --purge postgresql postgresql-* -y
apt autoremove -y
apt autoclean -y
```

### Remove Existing Node.js (if any)
```bash
rm -rf /usr/local/bin/node
rm -rf /usr/local/bin/npm
rm -rf /opt/nodejs
```

### Clean Up
```bash
apt update
apt upgrade -y
```

---

## Step 2: Install PostgreSQL

### Install PostgreSQL
```bash
apt install postgresql postgresql-contrib -y
```

### Start PostgreSQL
```bash
systemctl start postgresql
systemctl enable postgresql
systemctl status postgresql
```

### Verify Installation
```bash
sudo -u postgres psql --version
```

---

## Step 3: Set Up Database

### Create Database and User
```bash
sudo -u postgres psql
```

**Inside psql, run these commands one by one:**

```sql
-- Create database
CREATE DATABASE grade10_lms;

-- Create user
CREATE USER grade10_user WITH PASSWORD 'YourSecurePassword123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE grade10_lms TO grade10_user;

-- Connect to database
\c grade10_lms

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO grade10_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO grade10_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO grade10_user;

-- Exit
\q
```

---

## Step 4: Configure PostgreSQL for Remote Access

### Edit postgresql.conf
```bash
nano /etc/postgresql/*/main/postgresql.conf
```

**Find and change:**
```
#listen_addresses = 'localhost'
```

**To:**
```
listen_addresses = '*'
```

**Save:** `Ctrl+X`, `Y`, `Enter`

### Edit pg_hba.conf
```bash
nano /etc/postgresql/*/main/pg_hba.conf
```

**Add at the end:**
```
host    grade10_lms    grade10_user    0.0.0.0/0    md5
```

**Save:** `Ctrl+X`, `Y`, `Enter`

### Restart PostgreSQL
```bash
systemctl restart postgresql
```

### Allow Firewall Port
```bash
ufw allow 5432/tcp
ufw status
```

### Verify Listening
```bash
netstat -tulpn | grep 5432
```

**Should show:** `0.0.0.0:5432` (not just `127.0.0.1:5432`)

---

## Step 5: Install Node.js

### Install Node.js 20.x (Current LTS - Recommended)

**Note:** Node.js 18.x is deprecated. Use Node.js 20.x instead.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

**Or if you prefer Node.js 18.x (deprecated but still works):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

**Important:** Make sure to pipe to `bash -` (the `| bash -` part is required!)

### Verify Installation
```bash
node --version
npm --version
```

**Should show:** Node.js v18.x.x and npm version

---

## Step 6: Install PM2 (Process Manager)

```bash
npm install -g pm2
pm2 --version
```

---

## Step 7: Create Application Directory

```bash
mkdir -p /var/www/olp
cd /var/www/olp
```

---

## Step 8: Upload Application Files

### Option A: Using Git (Recommended)

**On VPS:**
```bash
cd /var/www/olp
git clone https://github.com/your-username/your-repo.git .
```

**Or if you have a private repo:**
```bash
git clone https://your-username:your-token@github.com/your-username/your-repo.git .
```

### Option B: Using SCP (from your local computer)

**On your local Windows computer (PowerShell):**
```powershell
cd C:\Users\JAKE\Documents\olp
scp -r * root@72.60.23.73:/var/www/olp/
```

**This will upload all files to the VPS.**

---

## Step 9: Install Dependencies

**On VPS:**
```bash
cd /var/www/olp
npm install
```

**Wait for installation to complete.**

---

## Step 10: Create .env File

**On VPS:**
```bash
cd /var/www/olp
nano .env
```

**Add this content:**
```
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=YourSecurePassword123!

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://olpmonitorke.com

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
```

**To generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output and paste it as JWT_SECRET in .env**

**Save:** `Ctrl+X`, `Y`, `Enter`

---

## Step 11: Run Database Migrations

**On VPS:**
```bash
cd /var/www/olp
npm run migrate
```

**Wait for migrations to complete. Should show:**
```
✅ Migration completed successfully
```

**Verify tables exist:**
```bash
sudo -u postgres psql -d grade10_lms -c "\dt"
```

**Should show tables like:** users, students, subjects, etc.

---

## Step 12: Start Application with PM2

**On VPS:**
```bash
cd /var/www/olp
pm2 start server.js --name olp-app
pm2 save
pm2 startup
```

**Follow the instructions** from `pm2 startup` to enable PM2 on boot.

**Check status:**
```bash
pm2 status
pm2 logs olp-app
```

**Should show:** Application running on port 3000

---

## Step 13: Configure Nginx (Reverse Proxy)

### Install Nginx
```bash
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

### Create Nginx Configuration
```bash
nano /etc/nginx/sites-available/olpmonitorke.com
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name olpmonitorke.com www.olpmonitorke.com;

    # Frontend (static files)
    location / {
        root /var/www/olp/public;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Save:** `Ctrl+X`, `Y`, `Enter`

### Enable Site
```bash
ln -s /etc/nginx/sites-available/olpmonitorke.com /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### Allow Firewall Ports
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw status
```

---

## Step 14: Install SSL Certificate (Let's Encrypt)

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d olpmonitorke.com -d www.olpmonitorke.com
```

**Follow the prompts:**
- Enter your email
- Agree to terms
- Choose redirect HTTP to HTTPS (option 2)

**SSL will be automatically configured!**

---

## Step 15: Update Frontend API URL

**On VPS:**
```bash
nano /var/www/olp/public/index.html
```

**Find:**
```javascript
const API_BASE_URL = '/api';
```

**Make sure it's set to `/api` (should already be correct).**

**Save:** `Ctrl+X`, `Y`, `Enter`

---

## Step 16: Restart Services

```bash
pm2 restart olp-app
systemctl restart nginx
```

---

## Step 17: Test the Application

1. **Go to:** https://olpmonitorke.com/
2. **Try to login** with: `student1` / `password123`
3. **Check PM2 logs:**
   ```bash
   pm2 logs olp-app
   ```

---

## Step 18: Update DNS Records

**In your domain registrar (where you manage olpmonitorke.com):**

1. **Go to DNS settings**
2. **Add/Update A record:**
   - **Type:** A
   - **Name:** @ (or blank)
   - **Value:** 72.60.23.73
   - **TTL:** 3600

3. **Add/Update A record for www:**
   - **Type:** A
   - **Name:** www
   - **Value:** 72.60.23.73
   - **TTL:** 3600

**Wait 5-10 minutes for DNS to propagate.**

---

## Troubleshooting

### Check PM2 Logs
```bash
pm2 logs olp-app --lines 50
```

### Check Nginx Logs
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Check PostgreSQL
```bash
systemctl status postgresql
sudo -u postgres psql -d grade10_lms -c "\dt"
```

### Restart Everything
```bash
pm2 restart olp-app
systemctl restart postgresql
systemctl restart nginx
```

---

## Summary Checklist

- ✅ VPS reset/cleaned
- ✅ PostgreSQL installed and configured
- ✅ Database and user created
- ✅ PostgreSQL configured for remote access
- ✅ Node.js installed
- ✅ PM2 installed
- ✅ Application uploaded
- ✅ Dependencies installed
- ✅ .env file created
- ✅ Migrations run
- ✅ Application started with PM2
- ✅ Nginx configured
- ✅ SSL certificate installed
- ✅ DNS records updated
- ✅ Application tested

---

## Quick Reference Commands

```bash
# Check application status
pm2 status
pm2 logs olp-app

# Restart application
pm2 restart olp-app

# Check database
sudo -u postgres psql -d grade10_lms -c "\dt"

# Check Nginx
systemctl status nginx
nginx -t

# Check PostgreSQL
systemctl status postgresql
netstat -tulpn | grep 5432
```

---

**Follow these steps in order, and your system will be fully deployed on the VPS!** 🚀

