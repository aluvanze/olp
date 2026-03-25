const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Configure multer for assignment file uploads
const uploadDir = path.join(__dirname, '../uploads/assignments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Get assignments for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    // Verify course access
    if (req.user.role === 'student') {
      const enrollmentCheck = await pool.query(
        'SELECT id FROM course_enrollments WHERE student_id = $1 AND course_id = $2 AND status = $3',
        [req.user.id, req.params.courseId, 'active']
      );
      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }
    }
    
    const result = await pool.query(
      `SELECT a.*, u.first_name as created_by_first_name, u.last_name as created_by_last_name,
              COUNT(DISTINCT asub.id) as submission_count
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
       WHERE a.course_id = $1
       GROUP BY a.id, u.first_name, u.last_name
       ORDER BY a.due_date DESC, a.created_at DESC`,
      [req.params.courseId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignment by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.first_name as created_by_first_name, u.last_name as created_by_last_name,
              c.course_name
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       LEFT JOIN courses c ON a.course_id = c.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    const assignment = result.rows[0];
    
    // Check enrollment for students
    if (req.user.role === 'student') {
      const enrollmentCheck = await pool.query(
        'SELECT id FROM course_enrollments WHERE student_id = $1 AND course_id = $2 AND status = $3',
        [req.user.id, assignment.course_id, 'active']
      );
      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }
    }
    
    res.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create assignment (teachers and admins)
router.post('/', authorize('teacher', 'headteacher', 'deputy_headteacher'), upload.array('attachments', 10), async (req, res) => {
  try {
    const { course_id, module_id, title, description, assignment_type, total_points, due_date, allow_late_submission, late_penalty_percent, instructions, term_number, academic_year } = req.body;
    
    // Verify course access for teachers
    if (req.user.role === 'teacher') {
      const courseCheck = await pool.query('SELECT id, teacher_id FROM courses WHERE id = $1', [course_id]);
      if (courseCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Course not found' });
      }

      const teacherId = String(req.user.id);
      const directTeacherId = courseCheck.rows[0].teacher_id != null ? String(courseCheck.rows[0].teacher_id) : null;

      // Allow either the legacy direct assignment (courses.teacher_id)
      // OR the term-based assignment table (teacher_course_assignments).
      if (directTeacherId !== teacherId) {
        const hasTerm = term_number != null && String(term_number).trim() !== '' && academic_year != null && String(academic_year).trim() !== '';
        const tca = await pool.query(
          `SELECT id
           FROM teacher_course_assignments
           WHERE course_id = $1 AND teacher_id = $2 AND is_active = true
             AND ($3::boolean = false OR (term_number = $4 AND academic_year = $5))
           LIMIT 1`,
          [course_id, req.user.id, hasTerm, hasTerm ? parseInt(term_number, 10) : null, hasTerm ? String(academic_year) : null]
        );
        if (tca.rows.length === 0) {
          return res.status(403).json({ message: 'Access denied: you are not assigned to this class for the selected term.' });
        }
      }
    }
    
    let attachments = null;
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.originalname,
        path: `/uploads/assignments/${file.filename}`,
        size: file.size
      }));
    }
    
    const result = await pool.query(
      `INSERT INTO assignments (course_id, module_id, title, description, assignment_type, total_points, 
                                due_date, allow_late_submission, late_penalty_percent, instructions, attachments, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [course_id, module_id || null, title, description, assignment_type || 'homework', total_points, 
       due_date ? new Date(due_date) : null, allow_late_submission !== false, late_penalty_percent || 0, instructions, 
       attachments ? JSON.stringify(attachments) : null, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit assignment (students only)
router.post('/:id/submit', authorize('student'), upload.array('files', 10), async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { submission_text } = req.body;
    
    // Verify assignment exists and student is enrolled
    const assignmentCheck = await pool.query(
      `SELECT a.*, ce.id as enrollment_id
       FROM assignments a
       INNER JOIN course_enrollments ce ON a.course_id = ce.course_id
       WHERE a.id = $1 AND ce.student_id = $2 AND ce.status = $3`,
      [assignmentId, req.user.id, 'active']
    );
    
    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found or not enrolled' });
    }
    
    const assignment = assignmentCheck.rows[0];
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
    const now = new Date();
    const isLate = dueDate && now > dueDate;
    
    let submissionFiles = null;
    if (req.files && req.files.length > 0) {
      submissionFiles = req.files.map(file => ({
        filename: file.originalname,
        path: `/uploads/assignments/${file.filename}`,
        size: file.size
      }));
    }
    
    const result = await pool.query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, submission_files, submitted_at, is_late)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET submission_text = EXCLUDED.submission_text,
                     submission_files = EXCLUDED.submission_files,
                     submitted_at = EXCLUDED.submitted_at,
                     is_late = EXCLUDED.is_late,
                     status = 'submitted',
                     updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [assignmentId, req.user.id, submission_text || null, submissionFiles ? JSON.stringify(submissionFiles) : null, now, isLate]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's submission
router.get('/:id/submission', async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user.id : req.query.student_id;
    
    if (!studentId && req.user.role === 'student') {
      studentId = req.user.id;
    }
    
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID required' });
    }
    
    const result = await pool.query(
      `SELECT asub.*, a.title as assignment_title, a.total_points
       FROM assignment_submissions asub
       INNER JOIN assignments a ON asub.assignment_id = a.id
       WHERE asub.assignment_id = $1 AND asub.student_id = $2`,
      [req.params.id, studentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all submissions for an assignment (teachers/admins)
router.get('/:id/submissions', authorize('teacher', 'headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT asub.*, u.first_name, u.last_name, u.email, a.title as assignment_title, a.total_points
       FROM assignment_submissions asub
       INNER JOIN users u ON asub.student_id = u.id
       INNER JOIN assignments a ON asub.assignment_id = a.id
       WHERE asub.assignment_id = $1
       ORDER BY asub.submitted_at DESC`,
      [req.params.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

