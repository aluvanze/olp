# Complete Guide: Point olpmonitor.com to VPS & Connect PostgreSQL

This guide will help you:
1. Point your domain `olpmonitor.com` to your VPS (72.60.23.73)
2. Connect your application to PostgreSQL
3. Set up Nginx with your domain
4. Configure SSL (HTTPS)

---

## Step 1: Configure DNS (Point Domain to VPS)

### ⚠️ CDN Enabled? Read This First!

If you see the error: **"Cannot add A/AAAA record when CDN is enabled"**, you have a CDN (Content Delivery Network) active on your domain. Here are your options:

---

### Option A: Disable CDN (Recommended for Direct VPS Connection)

1. Go to your domain registrar/hosting control panel
2. Find **CDN Settings** or **Cloud/CDN** section
3. **Disable CDN** or turn off "Proxy" mode
4. Wait 5-10 minutes for changes to take effect
5. Then proceed with adding A records (see below)

---

### Option B: Use CDN with Origin Server (If CDN Must Stay On)

If you must keep CDN enabled, configure it to point to your VPS:

1. In your CDN settings, find **Origin Server** or **Backend Server**
2. Set the origin IP to: `72.60.23.73`
3. The CDN will proxy requests to your VPS
4. **Note:** You may need to configure your VPS to accept requests from CDN IPs

---

### Option C: Use CNAME Instead of A Record

Some CDN providers allow CNAME records:

1. Create a subdomain like `origin.olpmonitor.com` pointing to `72.60.23.73` (A record)
2. Then use CNAME for `olpmonitor.com` pointing to `origin.olpmonitor.com`
3. Or configure CDN to use the subdomain as origin

---

### 1.1 Access Your Domain DNS Settings

1. Log in to your domain registrar (where you bought `olpmonitor.com`)
2. Find **DNS Management** or **DNS Settings**
3. Look for **A Record** or **DNS Records**

### 1.2 Add/Update A Record (After CDN is Disabled)

Create or update these DNS records:

| Type | Name/Host | Value/Target | TTL |
|------|-----------|--------------|-----|
| A | @ | 72.60.23.73 | 3600 (or default) |
| A | www | 72.60.23.73 | 3600 (or default) |

**What this means:**
- `@` = `olpmonitor.com` → points to 72.60.23.73
- `www` = `www.olpmonitor.com` → points to 72.60.23.73

### 1.3 Save and Wait

- DNS changes can take **5 minutes to 48 hours** to propagate
- Usually takes **15-30 minutes**
- You can check propagation: https://www.whatsmydns.net/#A/olpmonitor.com

---

## Step 2: Verify PostgreSQL is Running on VPS

SSH into your VPS:

```bash
ssh root@72.60.23.73
```

Check PostgreSQL status:

```bash
systemctl status postgresql
```

If it's not running:
```bash
systemctl start postgresql
systemctl enable postgresql
```

---

## Step 3: Verify Database and User Exist

Connect to PostgreSQL:

```bash
sudo -u postgres psql
```

Check if database and user exist:

```sql
\l
\du
```

You should see:
- Database: `grade10_lms`
- User: `grade10_user`

If they don't exist, create them:

```sql
CREATE USER grade10_user WITH PASSWORD 'z6hqp3qnmJDD5XW';
CREATE DATABASE grade10_lms OWNER grade10_user;
GRANT ALL PRIVILEGES ON DATABASE grade10_lms TO grade10_user;
\q
```

Test connection:

```bash
psql -U grade10_user -d grade10_lms -h localhost
```

Enter password when prompted. Type `\q` to exit.

---

## Step 4: Update .env File on VPS

Navigate to your application directory:

```bash
cd /var/www/olp
nano .env
```

Make sure your `.env` file has these exact settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=z6hqp3qnmJDD5XW

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string
JWT_EXPIRES_IN=7d

# Frontend URL - UPDATE THIS!
FRONTEND_URL=https://olpmonitor.com

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=noreply@olpmonitor.com
```

**Important:**
- Update `FRONTEND_URL` to `https://olpmonitor.com`
- Make sure `DB_PASSWORD` matches your actual password
- Generate a new `JWT_SECRET`: Run `openssl rand -base64 32` and use that value

Save: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 5: Test Database Connection

Run migrations to verify connection:

```bash
cd /var/www/olp
npm run migrate
```

If successful, you'll see:
```
Running migrations...
✓ All migrations completed successfully!
```

---

## Step 6: Install and Configure Nginx

### 6.1 Install Nginx

```bash
apt update
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 6.2 Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/olpmonitor
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name olpmonitor.com www.olpmonitor.com;

    # Increase upload size limit
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

Save: `Ctrl+X`, then `Y`, then `Enter`

### 6.3 Enable the Site

```bash
ln -s /etc/nginx/sites-available/olpmonitor /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## Step 7: Configure Firewall

```bash
# Allow SSH (important!)
ufw allow OpenSSH

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## Step 8: Install SSL Certificate (HTTPS)

### 8.1 Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 8.2 Obtain SSL Certificate

**Wait until DNS has propagated** (check with: `ping olpmonitor.com` - should show 72.60.23.73)

Then run:

```bash
certbot --nginx -d olpmonitor.com -d www.olpmonitor.com
```

Follow the prompts:
- Enter your email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 8.3 Auto-Renewal

Certbot sets up auto-renewal automatically. Test it:

```bash
certbot renew --dry-run
```

---

## Step 9: Start Your Application with PM2

### 9.1 Install PM2 (if not already installed)

```bash
npm install -g pm2
```

### 9.2 Start Application

```bash
cd /var/www/olp
pm2 start server.js --name olp-app
pm2 save
pm2 startup
```

Follow the instructions from `pm2 startup` (usually run a `sudo` command it provides).

### 9.3 Verify Application is Running

```bash
pm2 status
pm2 logs olp-app
```

Press `Ctrl+C` to exit logs.

---

## Step 10: Verify Everything Works

### 10.1 Check Services

```bash
# Check PM2
pm2 status

# Check Nginx
systemctl status nginx

# Check PostgreSQL
systemctl status postgresql
```

### 10.2 Test Your Domain

1. Open browser: `https://olpmonitor.com`
2. Or test API: `https://olpmonitor.com/api/health`

---

## Troubleshooting

### DNS Not Working

```bash
# Check if DNS has propagated
ping olpmonitor.com
nslookup olpmonitor.com

# Wait 15-30 minutes after DNS changes
```

### Application Not Accessible

```bash
# Check PM2 logs
pm2 logs olp-app

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Restart services
pm2 restart olp-app
systemctl restart nginx
```

### Database Connection Errors

```bash
# Verify PostgreSQL is running
systemctl status postgresql

# Test connection
psql -U grade10_user -d grade10_lms -h localhost

# Check .env file
cat /var/www/olp/.env | grep DB_
```

### SSL Certificate Issues

```bash
# Check certificate status
certbot certificates

# Renew manually if needed
certbot renew

# Check Nginx SSL configuration
nginx -t
```

---

## Quick Reference Commands

```bash
# Application
pm2 restart olp-app
pm2 logs olp-app
pm2 status

# Database
systemctl restart postgresql
psql -U grade10_user -d grade10_lms

# Nginx
systemctl restart nginx
nginx -t
tail -f /var/log/nginx/error.log

# SSL
certbot renew
certbot certificates
```

---

## Success Checklist

- [ ] DNS A records configured (olpmonitor.com → 72.60.23.73)
- [ ] DNS propagated (check with ping/nslookup)
- [ ] PostgreSQL running and accessible
- [ ] Database `grade10_lms` exists
- [ ] User `grade10_user` exists with correct password
- [ ] `.env` file configured with correct database credentials
- [ ] `.env` file has `FRONTEND_URL=https://olpmonitor.com`
- [ ] Migrations run successfully
- [ ] Nginx configured for olpmonitor.com
- [ ] SSL certificate installed (HTTPS working)
- [ ] PM2 running application
- [ ] Application accessible at https://olpmonitor.com

---

## Next Steps After Setup

1. **Change Default Passwords**: If you seeded data, change default user passwords
2. **Set Up Backups**: Configure automatic database backups
3. **Monitor Logs**: Set up log monitoring
4. **Update Application**: When you make changes, use:
   ```bash
   cd /var/www/olp
   git pull
   npm install
   npm run migrate  # if database changed
   pm2 restart olp-app
   ```

---

**Congratulations!** 🎉 Your application should now be live at https://olpmonitor.com!

