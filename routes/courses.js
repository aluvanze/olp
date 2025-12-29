const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Get all courses (optionally filtered by term and academic year)
router.get('/', async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    let query = `
      SELECT c.*, u.first_name as teacher_first_name, u.last_name as teacher_last_name,
             COUNT(DISTINCT ce.student_id) as enrolled_students
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'active'
      WHERE c.is_active = true
    `;
    const params = [];
    let paramCount = 1;
    
    // Filter by academic year if provided
    if (academic_year) {
      query += ` AND c.academic_year = $${paramCount}`;
      params.push(academic_year);
      paramCount++;
    }
    
    // Students only see their enrolled courses
    if (req.user.role === 'student') {
      query += ` AND c.id IN (SELECT course_id FROM course_enrollments WHERE student_id = $${paramCount} AND status = 'active')`;
      params.push(req.user.id);
      paramCount++;
    }
    
    // Parents see courses of their children
    if (req.user.role === 'parent') {
      query += ` AND c.id IN (
        SELECT course_id FROM course_enrollments 
        WHERE student_id IN (
          SELECT student_id FROM parent_student_relationships WHERE parent_id = $${paramCount}
        ) AND status = 'active'
      )`;
      params.push(req.user.id);
      paramCount++;
    }
    
    query += ' GROUP BY c.id, u.first_name, u.last_name ORDER BY c.course_name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get terms (available for teachers, students, and admins)
router.get('/terms', async (req, res) => {
  try {
    const { academic_year } = req.query;
    const currentYear = academic_year || new Date().getFullYear();
    const academicYearStr = `${currentYear}-${currentYear + 1}`;
    
    // Get terms from database
    const termsResult = await pool.query(
      `SELECT * FROM terms 
       WHERE academic_year = $1 AND is_active = true 
       ORDER BY term_number`,
      [academicYearStr]
    );
    
    // If no terms exist, return empty array
    if (termsResult.rows.length === 0) {
      return res.json([]);
    }
    
    // Get course counts per term
    const terms = termsResult.rows.map(term => {
      return {
        id: term.id,
        term: term.term_number,
        name: term.name,
        dateRange: `${term.date_range_start} - ${term.date_range_end}`,
        academic_year: term.academic_year,
        start_date: term.start_date,
        end_date: term.end_date,
        course_count: 0 // Will be populated below
      };
    });
    
    // Get course counts for each term
    for (const termData of terms) {
      let courseCountQuery = `
        SELECT COUNT(*) as count 
        FROM courses 
        WHERE academic_year = $1 AND is_active = true
      `;
      const params = [termData.academic_year];
      
      // Teachers only see their own courses
      if (req.user.role === 'teacher') {
        courseCountQuery += ' AND teacher_id = $2';
        params.push(req.user.id);
      }
      // Students only see enrolled courses
      else if (req.user.role === 'student') {
        courseCountQuery += ` AND id IN (
          SELECT course_id FROM course_enrollments 
          WHERE student_id = $2 AND status = 'active'
        )`;
        params.push(req.user.id);
      }
      
      const courseCount = await pool.query(courseCountQuery, params);
      termData.course_count = parseInt(courseCount.rows[0].count);
    }
    
    res.json(terms);
  } catch (error) {
    console.error('Get terms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get courses for a specific term (teachers, students, admins)
router.get('/term/:term/:academicYear', async (req, res) => {
  try {
    const { term, academicYear } = req.params;
    
    let query = `
      SELECT c.*, u.first_name as teacher_first_name, u.last_name as teacher_last_name,
             COUNT(DISTINCT ce.student_id) as enrolled_students
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'active'
      WHERE c.is_active = true AND c.academic_year = $1
    `;
    const params = [academicYear];
    let paramCount = 2;
    
    // Teachers only see their own courses
    if (req.user.role === 'teacher') {
      query += ` AND c.teacher_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }
    // Students only see enrolled courses
    else if (req.user.role === 'student') {
      query += ` AND c.id IN (SELECT course_id FROM course_enrollments WHERE student_id = $${paramCount} AND status = 'active')`;
      params.push(req.user.id);
      paramCount++;
    }
    
    query += ' GROUP BY c.id, u.first_name, u.last_name ORDER BY c.course_name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get courses for term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course by ID with detailed info
router.get('/:id', async (req, res) => {
  try {
    const courseResult = await pool.query(
      `SELECT c.*, u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const course = courseResult.rows[0];
    
    // Check access permissions
    if (req.user.role === 'student') {
      const enrollmentCheck = await pool.query(
        'SELECT id FROM course_enrollments WHERE student_id = $1 AND course_id = $2 AND status = $3',
        [req.user.id, req.params.id, 'active']
      );
      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }
    }
    
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create course (teachers and admins only)
router.post('/', authorize('teacher', 'headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    const { course_code, course_name, description, academic_year, semester, credits } = req.body;
    
    // Teachers can only create courses for themselves
    const teacherId = req.user.role === 'teacher' ? req.user.id : req.body.teacher_id;
    
    const result = await pool.query(
      `INSERT INTO courses (course_code, course_name, description, teacher_id, academic_year, semester, credits)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [course_code, course_name, description, teacherId, academic_year, semester || null, credits || 1]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Course code already exists' });
    }
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update course
router.put('/:id', authorize('teacher', 'headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    // Teachers can only update their own courses
    if (req.user.role === 'teacher') {
      const courseCheck = await pool.query(
        'SELECT teacher_id FROM courses WHERE id = $1',
        [req.params.id]
      );
      if (courseCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Course not found' });
      }
      if (courseCheck.rows[0].teacher_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const { course_name, description, academic_year, semester, credits } = req.body;
    
    const result = await pool.query(
      `UPDATE courses 
       SET course_name = COALESCE($1, course_name),
           description = COALESCE($2, description),
           academic_year = COALESCE($3, academic_year),
           semester = COALESCE($4, semester),
           credits = COALESCE($5, credits),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [course_name, description, academic_year, semester, credits, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll student in course (requires teacher authorization)
router.post('/:id/enroll', async (req, res) => {
  try {
    const { student_id } = req.body;
    const course_id = req.params.id;
    
    // Students can request enrollment themselves
    if (req.user.role === 'student' && req.user.id !== parseInt(student_id)) {
      return res.status(403).json({ message: 'You can only enroll yourself' });
    }
    
    // Verify course exists
    const courseCheck = await pool.query('SELECT id, teacher_id FROM courses WHERE id = $1', [course_id]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // If headteacher/superadmin enrolls, auto-approve
    // If teacher enrolls for their own course, auto-approve
    // Otherwise, set to pending
    let authStatus = 'pending';
    let authorizedBy = null;
    
    if (['headteacher', 'superadmin', 'deputy_headteacher'].includes(req.user.role)) {
      authStatus = 'approved';
      authorizedBy = req.user.id;
    } else if (req.user.role === 'teacher' && courseCheck.rows[0].teacher_id === req.user.id) {
      authStatus = 'approved';
      authorizedBy = req.user.id;
    }
    
    const result = await pool.query(
      `INSERT INTO course_enrollments (student_id, course_id, authorization_status, authorized_by, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id, course_id) 
       DO UPDATE SET 
         authorization_status = EXCLUDED.authorization_status,
         authorized_by = EXCLUDED.authorized_by,
         status = CASE WHEN EXCLUDED.authorization_status = 'approved' THEN 'active' ELSE 'inactive' END,
         enrollment_date = CURRENT_DATE
       RETURNING *`,
      [student_id, course_id, authStatus, authorizedBy, authStatus === 'approved' ? 'active' : 'inactive']
    );
    
    const message = authStatus === 'approved' 
      ? 'Enrollment successful' 
      : 'Enrollment request submitted. Waiting for teacher approval.';
    
    res.status(201).json({ ...result.rows[0], message });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

