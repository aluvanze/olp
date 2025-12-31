# Grade 10 Learning Management System (LMS)

A comprehensive Blackboard-style Learning Management System built with Node.js and PostgreSQL, designed for Grade 10 education with customizable modules for teachers.

## Features

### User Roles
- **Student**: Access learning modules, view documents, submit assignments, check grades and attendance
- **Teacher**: Create and customize courses, modules, assignments, mark attendance, grade work, manage final grades
- **Headteacher**: Full administrative access
- **Deputy Headteacher**: Administrative access with course oversight
- **Finance Personnel**: Access to financial records and reports
- **Parent**: View their child's progress, grades, attendance, and communicate with teachers

### Core Modules

#### 1. Learning Modules
- Teachers can create customizable learning modules with:
  - Documents (PDF, Word, etc.)
  - Videos
  - Links
  - Text content
- Students can study materials and track progress
- Modules can be published/unpublished by teachers

#### 2. Assignments
- Customizable assignment types (homework, quiz, project, exam)
- File upload support for both teachers and students
- Due dates with late submission handling
- Auto-detection of late submissions

#### 3. Attendance
- Daily attendance marking by teachers
- Bulk attendance entry
- Attendance statistics and percentage calculation
- Status tracking: Present, Absent, Late, Excused

#### 4. Grading Center
- Grade assignments with points and percentages
- Automatic letter grade calculation based on customizable grade scale
- Final grade calculation
- Grade summary views for students and teachers
- Complete grading center interface for course-wide grade management

#### 5. Email/Messaging System
- Internal messaging between users
- Email notifications (optional)
- Mark messages as read/important
- Inbox and sent folders

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL (recommended for relational educational data)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting

## Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository and install dependencies:**
```bash
npm install
```

2. **Set up PostgreSQL database:**
```bash
# Create database
createdb grade10_lms

# Or using psql:
psql -U postgres
CREATE DATABASE grade10_lms;
```

3. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your database credentials and settings
```

4. **Run database migrations:**
```bash
npm run migrate
```

5. **Seed initial data (optional):**
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

6. **Start the server:**
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/parent/:parentId/students` - Get students for a parent

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (teachers/admins)
- `PUT /api/courses/:id` - Update course
- `POST /api/courses/:id/enroll` - Enroll student in course

### Learning Modules
- `GET /api/modules/course/:courseId` - Get modules for a course
- `GET /api/modules/:id` - Get module with content
- `POST /api/modules` - Create module (teachers/admins)
- `PUT /api/modules/:id` - Update module
- `POST /api/modules/:id/content` - Add content to module
- `DELETE /api/modules/content/:contentId` - Delete module content

### Assignments
- `GET /api/assignments/course/:courseId` - Get assignments for a course
- `GET /api/assignments/:id` - Get assignment by ID
- `POST /api/assignments` - Create assignment
- `POST /api/assignments/:id/submit` - Submit assignment (students)
- `GET /api/assignments/:id/submission` - Get student submission
- `GET /api/assignments/:id/submissions` - Get all submissions (teachers)

### Attendance
- `GET /api/attendance/course/:courseId` - Get attendance records
- `GET /api/attendance/course/:courseId/student/:studentId/stats` - Get attendance statistics
- `POST /api/attendance/mark` - Mark attendance
- `POST /api/attendance/bulk-mark` - Bulk mark attendance
- `PUT /api/attendance/:id` - Update attendance record

### Grades
- `GET /api/grades/course/:courseId` - Get grades for a course
- `GET /api/grades/course/:courseId/student/:studentId/summary` - Get grade summary
- `POST /api/grades/grade` - Grade an assignment
- `POST /api/grades/course/:courseId/final-grade` - Calculate final grade
- `GET /api/grades/course/:courseId/grading-center` - Get grading center view

### Email/Messages
- `GET /api/email/inbox` - Get inbox messages
- `GET /api/email/sent` - Get sent messages
- `GET /api/email/:id` - Get message by ID
- `POST /api/email/send` - Send message
- `PUT /api/email/:id/read` - Mark as read
- `PUT /api/email/:id/important` - Mark as important
- `DELETE /api/email/:id` - Delete message
- `GET /api/email/unread/count` - Get unread message count

## Database Schema

The system uses PostgreSQL with the following main tables:
- `users` - User accounts with role-based access
- `courses` - Course/subject information
- `learning_modules` - Customizable learning modules
- `module_content` - Content items within modules
- `assignments` - Assignment definitions
- `assignment_submissions` - Student submissions
- `attendance` - Attendance records
- `grades` - Individual grades
- `final_grades` - Calculated final course grades
- `messages` - Internal messaging system
- `grade_scale` - Configurable grading scale

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- Helmet.js for security headers
- CORS configuration
- SQL injection protection (parameterized queries)

## File Uploads

Uploaded files are stored in:
- `/uploads/modules/` - Module documents
- `/uploads/assignments/` - Assignment files

Make sure these directories exist and have proper permissions.

## Email Configuration

To enable email notifications, configure SMTP settings in `.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

For Gmail, you'll need to generate an App Password in your Google Account settings.

## Frontend Integration

This is the backend API. You can integrate it with any frontend framework:
- React (recommended for Blackboard-style UI)
- Vue.js
- Angular
- Plain HTML/JavaScript

The API returns JSON responses and uses standard HTTP status codes.

## Development

- Use `npm run dev` for development with nodemon (auto-restart)
- API documentation available at `/api/health`
- Check logs for debugging

## License

ISC

## Support

For issues or questions, please refer to the project documentation or contact the development team.

