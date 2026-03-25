const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Students: list teachers they can rate (from current enrollments)
router.get('/teachers', authorize('student'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT
         t.id AS teacher_id,
         t.first_name AS teacher_first_name,
         t.last_name AS teacher_last_name,
         t.email AS teacher_email,
         c.course_name,
         c.course_code,
         tr.rating,
         tr.comments
       FROM course_enrollments ce
       INNER JOIN courses c ON ce.course_id = c.id
       INNER JOIN users t ON c.teacher_id = t.id AND t.role = 'teacher'
       LEFT JOIN teacher_ratings tr ON tr.teacher_id = t.id AND tr.rated_by_user_id = $1
       WHERE ce.student_id = $1 AND ce.status = 'active'
       ORDER BY t.first_name, t.last_name, c.course_name`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get teachers for ratings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Parents: list teachers for a child they can rate
router.get('/parent/teachers/:learnerId', authorize('parent', 'headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const learnerId = parseInt(req.params.learnerId, 10);
    if (Number.isNaN(learnerId)) return res.status(400).json({ message: 'Invalid learner ID' });

    if (req.user.role === 'parent') {
      const check = await pool.query('SELECT id FROM learner_profiles WHERE id = $1 AND parent_id = $2', [learnerId, req.user.id]);
      if (check.rows.length === 0) return res.status(403).json({ message: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT DISTINCT
         t.id AS teacher_id, t.first_name AS teacher_first_name, t.last_name AS teacher_last_name, t.email AS teacher_email,
         c.course_name, c.course_code,
         tr.rating, tr.comments
       FROM learner_profiles lp
       INNER JOIN course_enrollments ce ON ce.student_id = lp.user_id AND ce.status = 'active'
       INNER JOIN courses c ON ce.course_id = c.id
       INNER JOIN users t ON c.teacher_id = t.id AND t.role = 'teacher'
       LEFT JOIN teacher_ratings tr ON tr.teacher_id = t.id AND tr.rated_by_user_id = $1
       WHERE lp.id = $2
       ORDER BY t.first_name, t.last_name, c.course_name`,
      [req.user.id, learnerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get parent teacher ratings list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Students/Parents: rate a teacher (insert or update)
router.post('/', authorize('student', 'parent'), async (req, res) => {
  try {
    const teacherId = parseInt(req.body.teacher_id, 10);
    const rating = parseInt(req.body.rating, 10);
    const comments = (req.body.comments || '').toString().trim() || null;

    if (!teacherId || Number.isNaN(teacherId)) {
      return res.status(400).json({ message: 'Teacher is required' });
    }
    if (!rating || Number.isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const teacherCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2 AND is_active = true',
      [teacherId, 'teacher']
    );
    if (teacherCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const feedbackType = req.user.role === 'parent' ? 'parent' : 'student';
    await pool.query(
      `INSERT INTO teacher_ratings (teacher_id, rated_by_user_id, rating, feedback_type, comments)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (teacher_id, rated_by_user_id)
       DO UPDATE SET rating = EXCLUDED.rating, comments = EXCLUDED.comments, feedback_type = EXCLUDED.feedback_type, created_at = CURRENT_TIMESTAMP`,
      [teacherId, req.user.id, rating, feedbackType, comments]
    );

    res.status(201).json({ message: 'Teacher rated successfully' });
  } catch (error) {
    console.error('Rate teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
