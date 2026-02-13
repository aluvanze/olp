# VPS Setup Guide: Node.js & PostgreSQL

This guide will help you set up Node.js and PostgreSQL on your Ubuntu VPS (IP: 72.60.23.73).

---

## Step 1: Connect to Your VPS

Open your terminal (or PowerShell) and connect to your VPS:

```bash
ssh root@72.60.23.73
```

**Note:** If you're using a non-root user, replace `root` with your username. You'll be prompted for your password.

---

## Step 2: Update System Packages

Once connected, update your system:

```bash
sudo apt update
sudo apt upgrade -y
```

This ensures you have the latest security updates and package lists.

---

## Step 3: Install Essential Tools

Install basic tools needed for the setup:

```bash
sudo apt install -y curl wget git build-essential
```

---

## Step 4: Install Node.js

### Option A: Using NodeSource (Recommended - Latest LTS)

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

You should see output like:
```
v20.x.x
10.x.x
```

### Option B: Using NVM (Alternative)

If you prefer using Node Version Manager:

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

## Step 5: Install PostgreSQL

### 5.1 Install PostgreSQL

```bash
# Install PostgreSQL and additional utilities
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

You should see `active (running)` in green.

### 5.2 Verify PostgreSQL Installation

```bash
# Check PostgreSQL version
psql --version
```

---

## Step 6: Configure PostgreSQL Database

### 6.1 Create Database User and Database

```bash
# Switch to postgres user and open PostgreSQL prompt
sudo -u postgres psql
```

Once inside the PostgreSQL prompt (`postgres=#`), run these commands:

```sql
-- Create a new user for your application
CREATE USER grade10_user WITH PASSWORD 'your_secure_password_here';

-- Create the database
CREATE DATABASE grade10_lms OWNER grade10_user;

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE grade10_lms TO grade10_user;

-- Exit PostgreSQL
\q
```

**⚠️ IMPORTANT:** 
- Replace `your_secure_password_here` with a strong password
- **Write down this password** - you'll need it for your `.env` file later
- Example strong password: `MySecurePass123!@#`

### 6.2 Test Database Connection

Test that you can connect to the database:

```bash
# Connect to the database (you'll be prompted for the password)
psql -U grade10_user -d grade10_lms -h localhost
```

If successful, you'll see:
```
grade10_lms=>
```

Type `\q` to exit.

---

## Step 7: Verify Everything is Installed

Run these commands to confirm all installations:

```bash
# Check Node.js
node --version
npm --version

# Check PostgreSQL
psql --version
sudo systemctl status postgresql

# Check if PostgreSQL is listening
sudo netstat -tulpn | grep 5432
```

You should see:
- Node.js version (e.g., v20.x.x)
- npm version (e.g., 10.x.x)
- PostgreSQL version (e.g., psql (PostgreSQL) 14.x)
- PostgreSQL service status: `active (running)`
- Port 5432 listening

---

## Step 8: Next Steps

Now that Node.js and PostgreSQL are installed, you can:

1. **Clone your repository** (if you haven't already):
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/your-repo.git olp
   cd olp
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file** with your database credentials:
   ```bash
   nano .env
   ```
   
   Add these lines (use the password you created in Step 6.1):
   ```env
   PORT=3000
   NODE_ENV=production
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=grade10_lms
   DB_USER=grade10_user
   DB_PASSWORD=your_secure_password_here
   JWT_SECRET=your_super_secret_jwt_key_change_this
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://72.60.23.73
   ```

4. **Run database migrations**:
   ```bash
   npm run migrate
   ```

5. **Start your application** (using PM2 - see full deployment guide):
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name olp-app
   pm2 save
   ```

---

## Troubleshooting

### Node.js Not Found After Installation

```bash
# Reload your shell
source ~/.bashrc

# Or logout and login again
exit
ssh root@72.60.23.73
```

### PostgreSQL Won't Start

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# View error logs
sudo journalctl -u postgresql -n 50

# Try restarting
sudo systemctl restart postgresql
```

### Can't Connect to Database

```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check if port 5432 is listening
sudo netstat -tulpn | grep 5432

# Test connection with postgres user
sudo -u postgres psql -c "SELECT version();"
```

### Permission Denied Errors

```bash
# Make sure you're using sudo for system commands
sudo apt update

# For PostgreSQL commands, use sudo -u postgres
sudo -u postgres psql
```

---

## Quick Reference Commands

```bash
# Node.js
node --version
npm --version

# PostgreSQL
sudo systemctl status postgresql
sudo systemctl restart postgresql
sudo systemctl stop postgresql
sudo systemctl start postgresql

# Database connection
psql -U grade10_user -d grade10_lms -h localhost

# Check services
sudo systemctl status postgresql
```

---

## Security Notes

1. **Database Password**: Use a strong password (mix of uppercase, lowercase, numbers, special characters)
2. **Firewall**: Consider setting up UFW firewall (see full deployment guide)
3. **SSH Keys**: Consider using SSH keys instead of passwords for better security
4. **Non-root User**: Consider creating a non-root user for running your application

---

## Success Checklist

- [ ] Connected to VPS via SSH
- [ ] System packages updated
- [ ] Node.js installed and verified (`node --version` works)
- [ ] npm installed and verified (`npm --version` works)
- [ ] PostgreSQL installed and running (`sudo systemctl status postgresql` shows active)
- [ ] Database user `grade10_user` created
- [ ] Database `grade10_lms` created
- [ ] Can connect to database (`psql -U grade10_user -d grade10_lms` works)

---

**Congratulations!** 🎉 Node.js and PostgreSQL are now installed and configured on your VPS!

For the complete deployment guide including Nginx, PM2, SSL, and more, see `VPS_DEPLOYMENT_GUIDE.md`.













