# VPS Quick Setup Checklist

Use this as a quick reference while following the detailed guide in `VPS_DEPLOYMENT_GUIDE.md`.

## Pre-Deployment Checklist

- [ ] VPS with Ubuntu 20.04/22.04 ready
- [ ] SSH access configured
- [ ] GitHub repository URL ready
- [ ] Domain name (optional) configured

---

## Step-by-Step Commands

### 1. Initial Setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
```

### 3. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Create Database & User
```bash
sudo -u postgres psql
```
Then in psql:
```sql
CREATE USER grade10_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE grade10_lms OWNER grade10_user;
GRANT ALL PRIVILEGES ON DATABASE grade10_lms TO grade10_user;
\q
```

### 5. Clone Repository
```bash
cd /var/www
git clone https://github.com/yourusername/your-repo.git olp
cd olp
npm install
```

### 6. Configure Environment
```bash
nano .env
```
Add:
```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=your_secure_password
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://your_domain.com
```

### 7. Set Up Database
```bash
npm run migrate
npm run seed  # Optional
```

### 8. Install PM2
```bash
sudo npm install -g pm2
pm2 start server.js --name olp-app
pm2 save
pm2 startup  # Follow instructions
```

### 9. Install & Configure Nginx
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/olp
```
Add configuration (see full guide), then:
```bash
sudo ln -s /etc/nginx/sites-available/olp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 10. Configure Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 11. SSL (Optional)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

### 12. Create Upload Directories
```bash
mkdir -p uploads/modules uploads/assignments
chmod -R 755 uploads
```

---

## Verification

```bash
# Check PM2
pm2 status
pm2 logs olp-app

# Check Nginx
sudo systemctl status nginx

# Check PostgreSQL
sudo systemctl status postgresql

# Test database
psql -U grade10_user -d grade10_lms -h localhost
```

---

## Common Issues

**Port in use:**
```bash
sudo netstat -tulpn | grep 3000
```

**Permission denied:**
```bash
sudo chown -R $USER:$USER /var/www/olp
```

**Database connection failed:**
```bash
sudo systemctl restart postgresql
cat .env | grep DB_
```

---

## Update Commands

```bash
cd /var/www/olp
git pull
npm install
npm run migrate  # If schema changed
pm2 restart olp-app
```

---

See `VPS_DEPLOYMENT_GUIDE.md` for detailed explanations and troubleshooting.



