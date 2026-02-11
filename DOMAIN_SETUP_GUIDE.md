# Complete Guide: Point Your Domain to VPS IP Address

This guide will help you configure your domain to work with your VPS instead of using the IP address directly.

---

## ⚠️ IMPORTANT: CDN Error?

**If you see:** `"Cannot add A/AAAA record when CDN is enabled"`

👉 **See:** `FIX_CDN_DNS_ERROR.md` for detailed solutions

**Quick fix:** Disable CDN in your hosting control panel, then add A records.

---

## Prerequisites

- ✅ VPS with IP address: `72.60.23.73`
- ✅ Domain name from hosting provider
- ✅ Application running on VPS
- ✅ SSH access to VPS

---

## Step 1: Configure DNS Records (Point Domain to VPS IP)

### 1.1 Access Your Domain DNS Settings

1. Log in to your **domain registrar/hosting provider** (where you bought your domain)
2. Navigate to **DNS Management** or **DNS Settings**
3. Look for **DNS Records** or **Zone Editor**

### 1.2 Add A Record

Create an **A Record** pointing your domain to your VPS IP:

| Type | Name/Host | Value/Target | TTL |
|------|-----------|--------------|-----|
| A | @ | `YOUR_VPS_IP` | 3600 (or default) |
| A | www | `YOUR_VPS_IP` | 3600 (or default) |

**Example:**
- If your domain is `example.com` and VPS IP is `123.45.67.89`:
  - `@` record → `123.45.67.89` (points `example.com` to your VPS)
  - `www` record → `123.45.67.89` (points `www.example.com` to your VPS)

### 1.3 Save and Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate
- Usually takes **15-30 minutes**
- Check propagation: https://www.whatsmydns.net/#A/yourdomain.com

**Verify DNS is working:**
```bash
ping yourdomain.com
# Should show your VPS IP address
```

---

## Step 2: Update Environment Variables on VPS

SSH into your VPS and update the `.env` file:

```bash
ssh root@YOUR_VPS_IP
cd /var/www/olp  # or wherever your app is located
nano .env
```

Update these variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration (keep your existing values)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# ⭐ IMPORTANT: Update this with your domain
FRONTEND_URL=https://yourdomain.com

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@yourdomain.com
```

**Key changes:**
- Set `FRONTEND_URL=https://yourdomain.com` (use `http://` if you don't have SSL yet)
- Make sure there's **no trailing slash** (no `/` at the end)
- Use `https://` if you plan to set up SSL (recommended)

Save: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 3: Update Server Configuration (CORS)

The server already uses `FRONTEND_URL` from environment variables, but let's verify the CORS configuration is correct.

Check `server.js` on your VPS:

```bash
nano /var/www/olp/server.js
```

Make sure lines 44-46 look like this:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true
}));
```

This should automatically include your domain from `FRONTEND_URL`. If you need to add it manually, add it to the array:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:3002',
    'https://yourdomain.com',  // Add your domain here
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
```

---

## Step 4: Install and Configure Nginx (Reverse Proxy)

Nginx will handle incoming requests on port 80/443 and forward them to your Node.js app on port 3000.

### 4.1 Install Nginx

```bash
apt update
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 4.2 Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/yourdomain
```

Paste this configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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

### 4.3 Enable the Site

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/yourdomain /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# If test passes, reload nginx
systemctl reload nginx
```

---

## Step 5: Configure Firewall

Allow HTTP (80) and HTTPS (443) traffic:

```bash
# Allow SSH (important - don't lock yourself out!)
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

## Step 6: Install SSL Certificate (HTTPS) - Recommended

### 6.1 Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtain SSL Certificate

**Wait until DNS has propagated** (check with: `ping yourdomain.com` - should show your VPS IP)

Then run:

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: **Yes**)

### 6.3 Auto-Renewal

Certbot sets up auto-renewal automatically. Test it:

```bash
certbot renew --dry-run
```

---

## Step 7: Restart Your Application

After making changes, restart your application:

```bash
# If using PM2
pm2 restart olp-app
# or
pm2 restart all

# If running directly with npm/node
# Stop current process (Ctrl+C) and restart:
cd /var/www/olp
npm start
```

---

## Step 8: Verify Everything Works

### 8.1 Check Services

```bash
# Check application (PM2)
pm2 status

# Check Nginx
systemctl status nginx

# Check PostgreSQL (if applicable)
systemctl status postgresql
```

### 8.2 Test Your Domain

1. Open browser: `https://yourdomain.com` (or `http://` if no SSL)
2. Test API: `https://yourdomain.com/api/health`
3. Should see: `{"status":"ok","message":"Senior School OLP API is running"}`

---

## Troubleshooting

### DNS Not Working

```bash
# Check if DNS has propagated
ping yourdomain.com
nslookup yourdomain.com

# Wait 15-30 minutes after DNS changes
```

### Application Not Accessible

```bash
# Check application logs
pm2 logs olp-app

# Check Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Restart services
pm2 restart olp-app
systemctl restart nginx
```

### CORS Errors

If you see CORS errors in browser console:

1. Verify `FRONTEND_URL` in `.env` matches your domain exactly
2. Check `server.js` CORS configuration includes your domain
3. Restart application: `pm2 restart olp-app`

### SSL Certificate Issues

```bash
# Check certificate status
certbot certificates

# Renew manually if needed
certbot renew

# Check Nginx SSL configuration
nginx -t
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Find what's using the port
lsof -i :3000
# or
netstat -tulpn | grep :3000

# Kill the process or change PORT in .env
```

---

## Quick Reference Commands

```bash
# Application
pm2 restart olp-app
pm2 logs olp-app
pm2 status

# Nginx
systemctl restart nginx
nginx -t
tail -f /var/log/nginx/error.log

# SSL
certbot renew
certbot certificates

# Environment
nano /var/www/olp/.env
```

---

## Success Checklist

- [ ] DNS A records configured (domain → VPS IP)
- [ ] DNS propagated (verified with ping/nslookup)
- [ ] `.env` file updated with `FRONTEND_URL=https://yourdomain.com`
- [ ] CORS configuration includes your domain
- [ ] Nginx configured and running
- [ ] Firewall allows ports 80 and 443
- [ ] SSL certificate installed (HTTPS working)
- [ ] Application restarted
- [ ] Application accessible at `https://yourdomain.com`
- [ ] API health check works: `https://yourdomain.com/api/health`

---

## Common Issues

### Issue: "Cannot add A record when CDN is enabled"

**Solution:** If your hosting provider has CDN enabled:
1. Disable CDN temporarily, or
2. Configure CDN to use your VPS IP as the origin server

### Issue: Domain shows "This site can't be reached"

**Possible causes:**
- DNS not propagated yet (wait 15-30 minutes)
- Firewall blocking ports 80/443
- Nginx not running
- Application not running

**Fix:**
```bash
# Check services
systemctl status nginx
pm2 status

# Check firewall
ufw status
```

### Issue: "502 Bad Gateway"

**Cause:** Nginx can't connect to your Node.js app

**Fix:**
```bash
# Check if app is running
pm2 status

# Check app logs
pm2 logs olp-app

# Restart app
pm2 restart olp-app
```

---

**Congratulations!** 🎉 Your application should now be accessible via your domain instead of the IP address!

