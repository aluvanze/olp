# Upload and Deploy Your Application to VPS

This guide will help you upload your code to the VPS and deploy it.

---

## Option 1: Using GitHub (Recommended)

If your code is already on GitHub, this is the easiest method.

### Step 1: Push Your Code to GitHub (if not already done)

On your local machine (Windows), make sure your code is committed and pushed:

```powershell
cd C:\Users\JAKE\Documents\olp
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: On VPS - Clone Your Repository

In your VPS terminal, run:

```bash
# Create directory for web applications
mkdir -p /var/www
cd /var/www

# Clone your repository (replace with your actual GitHub URL)
git clone https://github.com/yourusername/your-repo-name.git olp
cd olp
```

**Note:** Replace `https://github.com/yourusername/your-repo-name.git` with your actual GitHub repository URL.

---

## Option 2: Using SCP (Direct File Transfer)

If you prefer to upload files directly without GitHub:

### Step 1: On Your Local Machine (Windows PowerShell)

```powershell
# Navigate to your project folder
cd C:\Users\JAKE\Documents\olp

# Upload files to VPS (replace with your actual repo name)
scp -r * root@72.60.23.73:/var/www/olp/
```

Or if the directory doesn't exist yet:

```powershell
# Create directory first
ssh root@72.60.23.73 "mkdir -p /var/www/olp"

# Then upload files
scp -r * root@72.60.23.73:/var/www/olp/
```

---

## Step 3: Install Node.js Dependencies

On your VPS terminal:

```bash
cd /var/www/olp
npm install
```

This will install all the packages listed in `package.json`.

---

## Step 4: Create .env File

On your VPS terminal:

```bash
nano .env
```

Paste the following configuration (adjust the values):

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=grade10_user
DB_PASSWORD=YourSecurePassword123!

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://72.60.23.73

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=noreply@grade10lms.com
```

**Important:**
- Replace `YourSecurePassword123!` with the actual password you created for `grade10_user`
- Generate a JWT_SECRET: Run `openssl rand -base64 32` on VPS and use that value
- Update `FRONTEND_URL` if you have a domain name

**To save in nano:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 5: Generate JWT Secret (Optional but Recommended)

On your VPS terminal:

```bash
openssl rand -base64 32
```

Copy the output and use it as your `JWT_SECRET` in the `.env` file.

---

## Step 6: Create Upload Directories

```bash
cd /var/www/olp
mkdir -p uploads/modules
mkdir -p uploads/assignments
chmod -R 755 uploads
```

---

## Step 7: Run Database Migrations

```bash
cd /var/www/olp
npm run migrate
```

You should see output like:
```
Running migrations...
Executing 001_initial_schema.sql...
✓ 001_initial_schema.sql completed
...
All migrations completed successfully!
```

---

## Step 8: Seed Initial Data (Optional)

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

## Step 9: Install PM2 (Process Manager)

PM2 keeps your application running and restarts it if it crashes.

```bash
npm install -g pm2
```

---

## Step 10: Start Your Application with PM2

```bash
cd /var/www/olp
pm2 start server.js --name olp-app
pm2 save
pm2 startup
```

The `pm2 startup` command will show you a command to run. Copy and execute it (usually requires `sudo`).

---

## Step 11: Verify Application is Running

```bash
pm2 status
pm2 logs olp-app
```

You should see your application running. Press `Ctrl+C` to exit the logs view.

---

## Step 12: Install and Configure Nginx

Nginx will serve your application and handle incoming requests.

### Install Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/olp
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name 72.60.23.73;

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

**To save:** Press `Ctrl+X`, then `Y`, then `Enter`

### Enable the Site

```bash
ln -s /etc/nginx/sites-available/olp /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## Step 13: Configure Firewall

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

## Step 14: Test Your Application

Open your browser and visit:
```
http://72.60.23.73
```

Or test the API:
```
http://72.60.23.73/api/health
```

---

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs olp-app

# Check if port is in use
netstat -tulpn | grep 3000

# Restart application
pm2 restart olp-app
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
psql -U grade10_user -d grade10_lms -h localhost

# Check .env file
cat /var/www/olp/.env | grep DB_
```

### Nginx Errors

```bash
# Check Nginx status
systemctl status nginx

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Test Nginx configuration
nginx -t
```

### Permission Issues

```bash
# Fix upload directory permissions
chown -R root:root /var/www/olp/uploads
chmod -R 755 /var/www/olp/uploads
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

# View logs
pm2 logs olp-app
tail -f /var/log/nginx/error.log
```

---

## Updating Your Application

When you make changes and want to update:

```bash
cd /var/www/olp
git pull origin main  # If using GitHub
npm install
npm run migrate  # If database changed
pm2 restart olp-app
```

---

## Success Checklist

- [ ] Code uploaded to `/var/www/olp`
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with correct database credentials
- [ ] Database migrations run (`npm run migrate`)
- [ ] PM2 installed and application running
- [ ] Nginx configured and running
- [ ] Firewall configured
- [ ] Application accessible at `http://72.60.23.73`

---

**Congratulations!** 🎉 Your application should now be live on your VPS!


