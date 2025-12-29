const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get system overview/dashboard (Headteacher and Superadmin)
router.get('/dashboard', authorize('headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    // Get statistics
    const stats = {};
    
    // User counts
    const userStats = await pool.query(
      `SELECT role, COUNT(*) as count 
       FROM users 
       WHERE is_active = true 
       GROUP BY role`
    );
    stats.users = userStats.rows.reduce((acc, row) => {
      acc[row.role] = parseInt(row.count);
      return acc;
    }, {});
    
    // Course statistics
    const courseStats = await pool.query(
      `SELECT 
         COUNT(*) as total_courses,
         COUNT(DISTINCT teacher_id) as teachers_with_courses,
         COUNT(DISTINCT ce.student_id) as enrolled_students
       FROM courses c
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'active'
       WHERE c.is_active = true`
    );
    stats.courses = courseStats.rows[0];
    
    // Assignment statistics
    const assignmentStats = await pool.query(
      `SELECT 
         COUNT(*) as total_assignments,
         COUNT(DISTINCT course_id) as courses_with_assignments,
         COUNT(DISTINCT asub.student_id) as students_with_submissions
       FROM assignments a
       LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id`
    );
    stats.assignments = assignmentStats.rows[0];
    
    // Grade statistics
    const gradeStats = await pool.query(
      `SELECT 
         COUNT(*) as total_grades,
         COUNT(DISTINCT student_id) as students_graded,
         COUNT(DISTINCT course_id) as courses_graded,
         AVG(percentage) as average_percentage
       FROM grades`
    );
    stats.grades = gradeStats.rows[0];
    
    // Attendance statistics
    const attendanceStats = await pool.query(
      `SELECT 
         COUNT(*) as total_records,
         COUNT(*) FILTER (WHERE status = 'present') as present_count,
         COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
         COUNT(DISTINCT student_id) as students_tracked,
         COUNT(DISTINCT course_id) as courses_tracked
       FROM attendance`
    );
    stats.attendance = attendanceStats.rows[0];
    
    res.json(stats);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all teachers with their classes (Headteacher/Superadmin)
router.get('/teachers/overview', authorize('headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         u.id, u.username, u.email, u.first_name, u.last_name, u.phone,
         COUNT(DISTINCT c.id) as total_courses,
         COUNT(DISTINCT ce.student_id) as total_students,
         COUNT(DISTINCT a.id) as total_assignments,
         COUNT(DISTINCT g.id) as total_grades_given,
         COUNT(DISTINCT att.id) as attendance_records
       FROM users u
       LEFT JOIN courses c ON u.id = c.teacher_id AND c.is_active = true
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'active'
       LEFT JOIN assignments a ON c.id = a.course_id
       LEFT JOIN grades g ON c.id = g.course_id AND g.graded_by = u.id
       LEFT JOIN attendance att ON c.id = att.course_id AND att.marked_by = u.id
       WHERE u.role = 'teacher' AND u.is_active = true
       GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.phone
       ORDER BY u.last_name, u.first_name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get teachers overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teacher's detailed class data
router.get('/teachers/:teacherId/classes', authorize('headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const courses = await pool.query(
      `SELECT 
         c.*,
         COUNT(DISTINCT ce.student_id) as enrolled_students,
         COUNT(DISTINCT a.id) as assignment_count,
         COUNT(DISTINCT lm.id) as module_count
       FROM courses c
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'active'
       LEFT JOIN assignments a ON c.id = a.course_id
       LEFT JOIN learning_modules lm ON c.id = lm.course_id
       WHERE c.teacher_id = $1 AND c.is_active = true
       GROUP BY c.id
       ORDER BY c.course_name`,
      [teacherId]
    );
    
    // Get detailed stats for each course
    const coursesWithStats = await Promise.all(
      courses.rows.map(async (course) => {
        // Average grade for this course
        const avgGrade = await pool.query(
          `SELECT AVG(percentage) as avg_percentage 
           FROM grades 
           WHERE course_id = $1`,
          [course.id]
        );
        
        // Attendance stats
        const attendanceStats = await pool.query(
          `SELECT 
             COUNT(*) as total_days,
             COUNT(*) FILTER (WHERE status = 'present') as present_days,
             ROUND(COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0), 2) as attendance_rate
           FROM attendance 
           WHERE course_id = $1`,
          [course.id]
        );
        
        return {
          ...course,
          average_grade: avgGrade.rows[0]?.avg_percentage || 0,
          attendance: attendanceStats.rows[0] || {}
        };
      })
    );
    
    res.json(coursesWithStats);
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new teacher (Headteacher/Superadmin)
router.post('/teachers', authorize('headteacher', 'superadmin'), async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, phone } = req.body;
    
    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({ message: 'Username, email, password, first_name, and last_name are required' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create teacher
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, 'teacher', $6)
       RETURNING id, username, email, first_name, last_name, role, phone, created_at`,
      [username, email, passwordHash, first_name, last_name, phone || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Allocate course to teacher (Headteacher/Superadmin)
router.post('/allocate-course', authorize('headteacher', 'superadmin'), async (req, res) => {
  try {
    const { teacher_id, course_id, notes } = req.body;
    
    if (!teacher_id || !course_id) {
      return res.status(400).json({ message: 'Teacher ID and Course ID are required' });
    }
    
    // Verify teacher exists and is a teacher
    const teacherCheck = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND role = $2',
      [teacher_id, 'teacher']
    );
    
    if (teacherCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Update course teacher
    const courseResult = await pool.query(
      `UPDATE courses 
       SET teacher_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [teacher_id, course_id]
    );
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Record allocation
    await pool.query(
      `INSERT INTO teacher_allocations (teacher_id, course_id, allocated_by, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (teacher_id, course_id) 
       DO UPDATE SET allocated_by = EXCLUDED.allocated_by, notes = EXCLUDED.notes`,
      [teacher_id, course_id, req.user.id, notes || null]
    );
    
    res.json({ message: 'Course allocated successfully', course: courseResult.rows[0] });
  } catch (error) {
    console.error('Allocate course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pending enrollments (for teachers to authorize)
router.get('/enrollments/pending', authorize('teacher', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    let query = `
      SELECT ce.*, 
             u.first_name, u.last_name, u.email, u.username,
             c.course_name, c.course_code,
             t.first_name as teacher_first_name, t.last_name as teacher_last_name
      FROM course_enrollments ce
      INNER JOIN users u ON ce.student_id = u.id
      INNER JOIN courses c ON ce.course_id = c.id
      LEFT JOIN users t ON c.teacher_id = t.id
      WHERE ce.authorization_status = 'pending'
    `;
    
    const params = [];
    
    // Teachers can only see enrollments for their courses
    if (req.user.role === 'teacher') {
      query += ' AND c.teacher_id = $1';
      params.push(req.user.id);
    }
    
    query += ' ORDER BY ce.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending enrollments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Authorize/reject student enrollment (Teacher/Headteacher/Superadmin)
router.post('/enrollments/:enrollmentId/authorize', authorize('teacher', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status, notes } = req.body; // status: 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    
    // Get enrollment with course info
    const enrollmentCheck = await pool.query(
      `SELECT ce.*, c.teacher_id 
       FROM course_enrollments ce
       INNER JOIN courses c ON ce.course_id = c.id
       WHERE ce.id = $1`,
      [enrollmentId]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    const enrollment = enrollmentCheck.rows[0];
    
    // Teachers can only authorize enrollments for their courses
    if (req.user.role === 'teacher' && enrollment.teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update enrollment
    const result = await pool.query(
      `UPDATE course_enrollments 
       SET authorization_status = $1,
           authorized_by = $2,
           authorization_date = CURRENT_TIMESTAMP,
           authorization_notes = $3,
           status = CASE WHEN $1 = 'approved' THEN 'active' ELSE 'inactive' END
       WHERE id = $4
       RETURNING *`,
      [status, req.user.id, notes || null, enrollmentId]
    );
    
    res.json({ message: `Enrollment ${status}`, enrollment: result.rows[0] });
  } catch (error) {
    console.error('Authorize enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Superadmin: Get all users with pagination
router.get('/users', authorize('superadmin'), async (req, res) => {
  try {
    const { role, search, is_active, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (role) {
      whereClause += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }
    
    if (search) {
      whereClause += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR username ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (is_active !== undefined) {
      whereClause += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);
    
    // Get paginated users
    let query = `
      SELECT id, username, email, first_name, last_name, role, phone, is_active, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limitNum, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      users: result.rows,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_items: total,
        items_per_page: limitNum,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Superadmin: Update user (activate/deactivate, change role)
router.put('/users/:id', authorize('superadmin'), async (req, res) => {
  try {
    const { is_active, role } = req.body;
    const userId = req.params.id;
    
    // Prevent changing own role or deactivating self
    if (userId == req.user.id) {
      return res.status(400).json({ message: 'Cannot modify your own account' });
    }
    
    let updateFields = [];
    const params = [];
    let paramCount = 1;
    
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      params.push(is_active);
      paramCount++;
    }
    
    if (role) {
      updateFields.push(`role = $${paramCount}`);
      params.push(role);
      paramCount++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(userId);
    
    const result = await pool.query(
      `UPDATE users 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, username, email, first_name, last_name, role, is_active`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

