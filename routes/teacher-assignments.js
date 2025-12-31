const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Get all teacher assignments for a term (Headteacher, Deputy, Superadmin)
router.get('/term/:term/:academicYear', authorize('headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const { term, academicYear } = req.params;
    
    const result = await pool.query(
      `SELECT 
        tca.id,
        tca.course_id,
        tca.teacher_id,
        tca.term_number,
        tca.academic_year,
        tca.is_active,
        c.course_code,
        c.course_name,
        c.description,
        u.first_name as teacher_first_name,
        u.last_name as teacher_last_name,
        u.email as teacher_email,
        assigned_by_user.first_name as assigned_by_first_name,
        assigned_by_user.last_name as assigned_by_last_name
      FROM teacher_course_assignments tca
      INNER JOIN courses c ON tca.course_id = c.id
      INNER JOIN users u ON tca.teacher_id = u.id
      LEFT JOIN users assigned_by_user ON tca.assigned_by = assigned_by_user.id
      WHERE tca.term_number = $1 AND tca.academic_year = $2
      ORDER BY c.course_name, u.last_name, u.first_name`,
      [term, academicYear]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all available learning areas - for assignment selection
// Returns courses (which represent learning areas for a specific academic year)
router.get('/courses', authorize('headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    // First try to get courses
    const coursesResult = await pool.query(
      `SELECT id, course_code, course_name, description, learning_area_id
       FROM courses
       WHERE is_active = true
       ORDER BY course_name`
    );
    
    // If courses exist, return them
    if (coursesResult.rows.length > 0) {
      return res.json(coursesResult.rows);
    }
    
    // Otherwise, return learning areas (subjects) that can be converted to courses
    const learningAreasResult = await pool.query(
      `SELECT 
        la.id as learning_area_id,
        la.code as course_code,
        la.name as course_name,
        la.description,
        la.id as id
       FROM learning_areas la
       WHERE la.is_active = true OR la.is_active IS NULL
       ORDER BY la.name`
    );
    
    res.json(learningAreasResult.rows);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all teachers
router.get('/teachers', authorize('headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, username, phone
       FROM users
       WHERE role = 'teacher' AND is_active = true
       ORDER BY last_name, first_name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign teacher to course for a term
router.post('/', authorize('headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const { course_id, teacher_id, term_number, academic_year } = req.body;
    
    // Validate term number
    if (term_number < 1 || term_number > 3) {
      return res.status(400).json({ message: 'Term number must be between 1 and 3' });
    }
    
    // Check if assignment already exists
    const existingCheck = await pool.query(
      `SELECT id FROM teacher_course_assignments
       WHERE course_id = $1 AND teacher_id = $2 AND term_number = $3 AND academic_year = $4`,
      [course_id, teacher_id, term_number, academic_year]
    );
    
    if (existingCheck.rows.length > 0) {
      // Update existing assignment to active
      const updateResult = await pool.query(
        `UPDATE teacher_course_assignments
         SET is_active = true, assigned_by = $1, assigned_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [req.user.id, existingCheck.rows[0].id]
      );
      return res.json(updateResult.rows[0]);
    }
    
    // Create new assignment
    const result = await pool.query(
      `INSERT INTO teacher_course_assignments 
       (course_id, teacher_id, term_number, academic_year, assigned_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [course_id, teacher_id, term_number, academic_year, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'This teacher is already assigned to this course for this term' });
    }
    console.error('Assign teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove teacher assignment (deactivate)
router.delete('/:id', authorize('headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE teacher_course_assignments
       SET is_active = false
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json({ message: 'Assignment removed successfully', assignment: result.rows[0] });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get courses assigned to a teacher for a term
router.get('/teacher/:teacherId/term/:term/:academicYear', async (req, res) => {
  try {
    const { teacherId, term, academicYear } = req.params;
    
    // Teachers can only see their own assignments, admins can see any
    if (req.user.role === 'teacher' && parseInt(req.user.id) !== parseInt(teacherId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const result = await pool.query(
      `SELECT 
        tca.id,
        tca.course_id,
        tca.term_number,
        tca.academic_year,
        c.course_code,
        c.course_name,
        c.description
      FROM teacher_course_assignments tca
      INNER JOIN courses c ON tca.course_id = c.id
      WHERE tca.teacher_id = $1 
        AND tca.term_number = $2 
        AND tca.academic_year = $3
        AND tca.is_active = true
      ORDER BY c.course_name`,
      [teacherId, term, academicYear]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get teacher courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

