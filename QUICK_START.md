# Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js installed (v14+)
- [ ] PostgreSQL installed and running
- [ ] npm or yarn package manager

## Installation Steps

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE grade10_lms;
   ```

3. **Create `.env` file** (copy from `.env.example` if available, or create manually):
   ```
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=grade10_lms
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   JWT_SECRET=change_this_to_a_random_string
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   EMAIL_FROM=noreply@grade10lms.com
   FRONTEND_URL=http://localhost:3001
   ```

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

5. **Seed initial data (optional):**
   ```bash
   npm run seed
   ```

6. **Start the server:**
   ```bash
   npm start
   # OR for development:
   npm run dev
   ```

7. **Open browser:**
   Navigate to: `http://localhost:3000`

## Default Login Credentials (after seeding)

| Role | Username | Password |
|------|----------|----------|
| Headteacher | `headteacher` | `password123` |
| Deputy Headteacher | `deputy` | `password123` |
| Finance | `finance` | `password123` |
| Teacher | `teacher1` | `password123` |
| Student | `student1` | `password123` |
| Parent | `parent1` | `password123` |

## Key Features by Role

### Student
- View enrolled courses
- Access learning modules and study documents
- Submit assignments
- View grades and attendance
- Send/receive messages

### Teacher
- Create and customize courses
- Create learning modules with documents/videos
- Create assignments with due dates
- Mark attendance (individual or bulk)
- Grade assignments
- Calculate final grades in Grading Center
- Send messages to students/parents

### Parent
- View child's courses
- View child's grades and attendance
- Communicate with teachers

### Headteacher/Deputy Headteacher
- Full system access
- Manage all users
- Oversee all courses
- Administrative functions

### Finance Personnel
- Access to financial records (can be extended)

## API Testing

You can test the API using:
- Browser (for GET requests)
- Postman
- curl
- The included web interface

Example API call:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"password123"}'

# Get courses (use token from login)
curl http://localhost:3000/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Project Structure

```
olp/
├── config/
│   └── database.js          # Database connection
├── middleware/
│   └── auth.js              # Authentication middleware
├── migrations/
│   ├── 001_initial_schema.sql  # Database schema
│   ├── runMigrations.js     # Migration runner
│   └── seedData.js          # Seed initial data
├── public/
│   ├── index.html           # Web interface
│   └── styles.css           # Styling
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management
│   ├── courses.js           # Course management
│   ├── modules.js           # Learning modules
│   ├── assignments.js       # Assignments & submissions
│   ├── attendance.js        # Attendance tracking
│   ├── grades.js            # Grading system
│   └── email.js             # Messaging system
├── uploads/                 # File uploads directory
│   ├── modules/             # Module documents
│   └── assignments/         # Assignment files
├── server.js                # Main server file
├── package.json             # Dependencies
└── README.md                # Full documentation
```

## Next Steps

1. **Change default passwords** after first login
2. **Configure email** for notifications (optional)
3. **Create your first course** as a teacher
4. **Customize grade scale** if needed (default is A-F)
5. **Enroll students** in courses
6. **Add learning materials** to modules
7. **Create assignments** and grade them
8. **Mark attendance** regularly

## Troubleshooting

**Database connection error?**
- Check PostgreSQL is running
- Verify credentials in `.env`
- Test connection: `psql -U postgres -d grade10_lms`

**Port already in use?**
- Change `PORT` in `.env` file

**Migration errors?**
- Drop and recreate database
- Run migrations again

**Need help?**
- Check `SETUP.md` for detailed setup instructions
- Check `DATABASE_INFO.md` for database information
- Check `README.md` for full documentation

