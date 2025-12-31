# Grade 10 LMS - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Or use Chocolatey: `choco install postgresql`
- During installation, remember the password you set for the `postgres` user

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 3. Create Database

Open PostgreSQL command line (psql) and run:

```sql
CREATE DATABASE grade10_lms;
```

Or from command line:
```bash
createdb grade10_lms
```

### 4. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` file with your database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade10_lms
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
JWT_SECRET=your_random_secret_key_here
```

**Important:** Change `JWT_SECRET` to a random string for security!

### 5. Run Database Migrations

This creates all the database tables:
```bash
npm run migrate
```

### 6. Seed Initial Data (Optional)

This creates sample users and data:
```bash
npm run seed
```

Default login credentials after seeding:
- **Headteacher**: username: `headteacher`, password: `password123`
- **Deputy Headteacher**: username: `deputy`, password: `password123`
- **Finance**: username: `finance`, password: `password123`
- **Teacher**: username: `teacher1`, password: `password123`
- **Student**: username: `student1`, password: `password123`
- **Parent**: username: `parent1`, password: `password123`

### 7. Start the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

### 8. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Email Configuration (Optional)

To enable email notifications, configure SMTP settings in `.env`:

For Gmail:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `.env`:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=noreply@grade10lms.com
```

## File Uploads

The system stores uploaded files in:
- `uploads/modules/` - Learning module documents
- `uploads/assignments/` - Assignment files

These directories will be created automatically. Ensure the application has write permissions.

## Troubleshooting

### Database Connection Error

1. Verify PostgreSQL is running:
   - Windows: Check Services
   - macOS: `brew services list`
   - Linux: `sudo systemctl status postgresql`

2. Check database credentials in `.env`

3. Test connection:
   ```bash
   psql -U postgres -d grade10_lms
   ```

### Port Already in Use

Change the PORT in `.env`:
```
PORT=3001
```

### Migration Errors

If migrations fail:
1. Drop and recreate the database:
   ```sql
   DROP DATABASE grade10_lms;
   CREATE DATABASE grade10_lms;
   ```
2. Run migrations again: `npm run migrate`

## Next Steps

1. Login with default credentials
2. Create courses and modules as a teacher
3. Enroll students in courses
4. Upload learning materials
5. Create assignments
6. Mark attendance
7. Grade assignments
8. Calculate final grades

## Production Deployment

For production:
1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure a production database
4. Set up proper SSL/HTTPS
5. Configure proper file storage (consider cloud storage)
6. Set up backup procedures for the database
7. Configure proper logging

