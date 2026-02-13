# VPS Deployment Guide - Complete Setup

This guide will walk you through setting up your OLP system on a VPS (Virtual Private Server) from scratch, including PostgreSQL database setup.

## Prerequisites

- A VPS with Ubuntu 20.04/22.04 or similar Linux distribution
- SSH access to your VPS
- Root or sudo access
- Your GitHub repository URL
- A domain name (optional, but recommended)

---

## Step 1: Initial VPS Setup

### 1.1 Connect to Your VPS

```bash
ssh root@72.60.23.73
# Or if using a non-root user:
ssh root@72.60.23.73
```

### 1.2 Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Install Essential Tools

```bash
sudo apt install -y curl wget git build-essential
```

---

## Step 2: Install Node.js

### Option A: Using NodeSource (Recommended - Latest LTS)

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Option B: Using NVM (Node Version Manager)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Verify
node --version
npm --version
```

---

## Step 3: Install PostgreSQL

### 3.1 Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
psql --version
```

### 3.2 Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside psql, create a new database user and database
CREATE USER grade10_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE grade10_lms OWNER grade10_user;
GRANT ALL PRIVILEGES ON DATABASE grade10_lms TO grade10_user;

# Exit psql
\q
```

**Important:** Replace `your_secure_password_here` with a strong password. Save this password - you'll need it for the `.env` file.

### 3.3 Configure PostgreSQL for Remote Access (Optional)

If you need remote database access:

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/*/main/postgresql.conf

# Find and uncomment/modify:
# listen_addresses = 'localhost'  # Change to '*' for all interfaces or specific IP

# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Add line (adjust IP range as needed):
# host    grade10_lms    grade10_user    0.0.0.0/0    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**Security Note:** Only enable remote access if necessary and restrict IP ranges in production.

---

## Step 4: Clone Your Repository from GitHub

### 4.1 Set Up SSH Key (Recommended) or Use HTTPS

**Option A: Using HTTPS (Simpler)**

```bash
# Navigate to your home directory or desired location
cd ~
# Or create a directory for your apps
sudo mkdir -p /var/www
cd /var/www

# Clone your repository
git clone https://github.com/yourusername/your-repo-name.git olp
cd olp
```

**Option B: Using SSH (More Secure)**

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Display public key
cat ~/.ssh/id_ed25519.pub

# Add this key to your GitHub account:
# GitHub → Settings → SSH and GPG keys → New SSH key
# Then clone:
git clone git@github.com:yourusername/your-repo-name.git olp
cd olp
```

### 4.2 Install Project Dependencies

```bash
npm install
```

---

## Step 5: Configure Environment Variables

### 5.1 Create .env File

```bash
# Create .env file
nano .env
```

### 5.2 Add Configuration

Paste the following configuration and adjust values:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string
JWT_EXPIRES_IN=7d

# Frontend URL (update with your domain or VPS IP)
FRONTEND_URL=http://your_domain.com
# Or if using IP:
# FRONTEND_URL=http://your_vps_ip:3000

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=noreply@grade10lms.com
```

**Important Security Notes:**
- Replace `your_secure_password_here` with the PostgreSQL password you created
- Generate a strong random string for `JWT_SECRET` (you can use: `openssl rand -base64 32`)
- Update `FRONTEND_URL` with your domain or VPS IP address

### 5.3 Save and Exit

Press `Ctrl+X`, then `Y`, then `Enter` to save.

---

## Step 6: Set Up Database

### 6.1 Run Database Migrations

```bash
npm run migrate
```

You should see output like:
```
Running migrations...
Executing 001_initial_schema.sql...
✓ 001_initial_schema.sql completed
...
All migrations completed successfully!
Database setup complete!
```

### 6.2 Seed Initial Data (Optional)

```bash
npm run seed
```

This creates default users:
- Username: `headteacher` / Password: `password123`
- Username: `deputy` / Password: `password123`
- Username: `finance` / Password: `password123`
- Username: `teacher1` / Password: `password123`
- Username: `student1` / Password: `password123`
- Username: `parent1` / Password: `password123`

**Important:** Change these default passwords immediately after first login!

---

## Step 7: Set Up Process Manager (PM2)

PM2 keeps your application running and restarts it if it crashes.

### 7.1 Install PM2

```bash
sudo npm install -g pm2
```

### 7.2 Start Your Application with PM2

```bash
# Navigate to your project directory
cd /var/www/olp  # or wherever you cloned the repo

# Start the application
pm2 start server.js --name olp-app

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup
# Follow the instructions it provides (usually run a sudo command)
```

### 7.3 Useful PM2 Commands

```bash
pm2 status          # Check application status
pm2 logs olp-app     # View logs
pm2 restart olp-app  # Restart application
pm2 stop olp-app     # Stop application
pm2 monit            # Monitor resources
```

---

## Step 8: Set Up Nginx as Reverse Proxy (Recommended)

Nginx will handle incoming requests and forward them to your Node.js application.

### 8.1 Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 8.2 Configure Nginx

```bash
# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/olp
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;
    # Or use your VPS IP if no domain:
    # server_name your_vps_ip;

    # Increase upload size limit (for file uploads)
    client_max_body_size 50M;

    location / {
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

    # Serve static files directly
    location /uploads {
        alias /var/www/olp/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Important:** Replace `your_domain.com` with your actual domain, or use your VPS IP address.

### 8.3 Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/olp /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 9: Configure Firewall

### 9.1 Set Up UFW (Uncomplicated Firewall)

```bash
# Allow SSH (important - do this first!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# If you need direct access to Node.js (not recommended in production)
# sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 10: Set Up SSL Certificate (Optional but Recommended)

### 10.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 10.2 Obtain SSL Certificate

```bash
# Replace with your domain
sudo certbot --nginx -d your_domain.com -d www.your_domain.com
```

Follow the prompts. Certbot will automatically configure Nginx for HTTPS.

### 10.3 Auto-Renewal

Certbot sets up auto-renewal automatically. Test it:

```bash
sudo certbot renew --dry-run
```

---

## Step 11: Create Upload Directories

```bash
# Navigate to project directory
cd /var/www/olp

# Create upload directories
mkdir -p uploads/modules
mkdir -p uploads/assignments

# Set proper permissions
chmod -R 755 uploads
```

---

## Step 12: Verify Everything Works

### 12.1 Check Application Status

```bash
pm2 status
pm2 logs olp-app --lines 50
```

### 12.2 Check Database Connection

```bash
# Test database connection
psql -U grade10_user -d grade10_lms -h localhost
# Enter password when prompted
# Type \q to exit
```

### 12.3 Test Application

- Visit `http://your_domain.com` or `http://your_vps_ip`
- Or test API: `http://your_domain.com/api/health`

---

## Step 13: Set Up Automatic Backups (Recommended)

### 13.1 Create Backup Script

```bash
# Create backup directory
mkdir -p ~/backups

# Create backup script
nano ~/backup-database.sh
```

Add this content:

```bash
#!/bin/bash
BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="grade10_lms"
DB_USER="grade10_user"

# Create backup
pg_dump -U $DB_USER -h localhost $DB_NAME > "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
```

Make it executable:

```bash
chmod +x ~/backup-database.sh
```

### 13.2 Set Up Cron Job for Daily Backups

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /home/your_username/backup-database.sh >> /home/your_username/backup.log 2>&1
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs olp-app

# Check if port is in use
sudo netstat -tulpn | grep 3000

# Check Node.js version
node --version
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U grade10_user -d grade10_lms -h localhost

# Check .env file has correct credentials
cat .env | grep DB_
```

### Nginx Errors

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t
```

### Permission Issues

```bash
# Fix upload directory permissions
sudo chown -R $USER:$USER /var/www/olp/uploads
chmod -R 755 /var/www/olp/uploads
```

---

## Updating Your Application

When you push changes to GitHub:

```bash
# Navigate to project directory
cd /var/www/olp

# Pull latest changes
git pull origin main  # or master, depending on your branch

# Install any new dependencies
npm install

# Run migrations if database schema changed
npm run migrate

# Restart application
pm2 restart olp-app

# Check logs
pm2 logs olp-app
```

---

## Security Checklist

- [ ] Changed default database password
- [ ] Set strong JWT_SECRET
- [ ] Changed default user passwords after seeding
- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed (HTTPS)
- [ ] Regular backups configured
- [ ] Nginx configured with proper security headers
- [ ] Application running as non-root user (recommended)
- [ ] Database user has minimal required privileges
- [ ] .env file has proper permissions (chmod 600)

---

## Quick Reference Commands

```bash
# Application
pm2 restart olp-app
pm2 logs olp-app
pm2 status

# Database
sudo systemctl restart postgresql
psql -U grade10_user -d grade10_lms

# Nginx
sudo systemctl restart nginx
sudo nginx -t

# Firewall
sudo ufw status
sudo ufw allow 80/tcp

# View logs
pm2 logs olp-app
sudo tail -f /var/log/nginx/error.log
```

---

## Next Steps

1. **Change Default Passwords**: Log in and change all default user passwords
2. **Configure Email**: Set up email notifications if needed
3. **Set Up Monitoring**: Consider setting up monitoring tools
4. **Regular Updates**: Keep system packages updated
5. **Backup Strategy**: Test your backup and restore process

---

## Support

If you encounter issues:
1. Check application logs: `pm2 logs olp-app`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
4. Verify all services are running: `sudo systemctl status postgresql nginx`

---

**Congratulations!** Your OLP system should now be running on your VPS! 🎉














