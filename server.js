require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const moduleRoutes = require('./routes/modules');
const assignmentRoutes = require('./routes/assignments');
const attendanceRoutes = require('./routes/attendance');
const gradeRoutes = require('./routes/grades');
const emailRoutes = require('./routes/email');
const adminRoutes = require('./routes/admin');
const assessmentRoutes = require('./routes/assessments');
const termRoutes = require('./routes/terms');
const studentRegistrationRoutes = require('./routes/student-registration');
const teacherAssignmentRoutes = require('./routes/teacher-assignments');
const substrandRoutes = require('./routes/substrands');
const gradeLevelsRoutes = require('./routes/grades-management');
const financeRoutes = require('./routes/finance');
const { pool } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000", "https://cdn.jsdelivr.net"],
    },
  },
}));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - More lenient for development and dashboard usage
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased to 1000 requests per 15 minutes for dashboard usage
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for auth endpoints (to prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
// Auth endpoints with stricter limits (security-sensitive)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/change-password', authLimiter);
// General API rate limiting (more lenient for dashboard operations)
app.use('/api/', generalLimiter);

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

// Serve static files from public directory
app.use(express.static('public'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/terms', termRoutes);
app.use('/api/student-registration', studentRegistrationRoutes);
app.use('/api/teacher-assignments', teacherAssignmentRoutes);
app.use('/api/substrands', substrandRoutes);
app.use('/api/admin/grade-levels', gradeLevelsRoutes);
app.use('/api/finance', financeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Senior School OLP API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Senior School OLP Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

