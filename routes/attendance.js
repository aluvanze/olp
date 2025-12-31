const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get attendance for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { start_date, end_date, student_id } = req.query;
    
    let query = `
      SELECT a.*, u.first_name, u.last_name, u.email
      FROM attendance a
      INNER JOIN users u ON a.student_id = u.id
      WHERE a.course_id = $1
    `;
    const params = [req.params.courseId];
    let paramCount = 2;
    
    // Students can only see their own attendance
    if (req.user.role === 'student') {
      query += ` AND a.student_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (student_id) {
      query += ` AND a.student_id = $${paramCount}`;
      params.push(student_id);
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND a.attendance_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND a.attendance_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    query += ' ORDER BY a.attendance_date DESC, u.last_name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance statistics for a student in a course
router.get('/course/:courseId/student/:studentId/stats', async (req, res) => {
  try {
    // Verify access
    if (req.user.role === 'student' && req.user.id !== parseInt(req.params.studentId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_days,
         COUNT(*) FILTER (WHERE status = 'present') as present_days,
         COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
         COUNT(*) FILTER (WHERE status = 'late') as late_days,
         COUNT(*) FILTER (WHERE status = 'excused') as excused_days,
         ROUND(COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0), 2) as attendance_percentage
       FROM attendance
       WHERE course_id = $1 AND student_id = $2`,
      [req.params.courseId, req.params.studentId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark attendance (teachers and admins)
router.post('/mark', authorize('teacher', 'headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    const { course_id, student_id, attendance_date, status, notes } = req.body;
    
    // Verify course access for teachers
    if (req.user.role === 'teacher') {
      const courseCheck = await pool.query('SELECT teacher_id FROM courses WHERE id = $1', [course_id]);
      if (courseCheck.rows.length === 0 || courseCheck.rows[0].teacher_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const result = await pool.query(
      `INSERT INTO attendance (course_id, student_id, attendance_date, status, notes, marked_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (course_id, student_id, attendance_date)
       DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, marked_by = EXCLUDED.marked_by
       RETURNING *`,
      [course_id, student_id, attendance_date, status, notes || null, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ message: 'Invalid course or student ID' });
    }
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk mark attendance
router.post('/bulk-mark', authorize('teacher', 'headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    const { course_id, attendance_date, records } = req.body; // records: [{student_id, status, notes}]
    
    // Verify course access
    if (req.user.role === 'teacher') {
      const courseCheck = await pool.query('SELECT teacher_id FROM courses WHERE id = $1', [course_id]);
      if (courseCheck.rows.length === 0 || courseCheck.rows[0].teacher_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      
      for (const record of records) {
        const result = await client.query(
          `INSERT INTO attendance (course_id, student_id, attendance_date, status, notes, marked_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (course_id, student_id, attendance_date)
           DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, marked_by = EXCLUDED.marked_by
           RETURNING *`,
          [course_id, record.student_id, attendance_date, record.status, record.notes || null, req.user.id]
        );
        results.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      res.status(201).json({ message: 'Attendance marked successfully', records: results });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update attendance record
router.put('/:id', authorize('teacher', 'headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    // Verify access
    const attendanceCheck = await pool.query(
      `SELECT a.*, c.teacher_id 
       FROM attendance a
       INNER JOIN courses c ON a.course_id = c.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    
    if (attendanceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    if (req.user.role === 'teacher' && attendanceCheck.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const result = await pool.query(
      `UPDATE attendance 
       SET status = COALESCE($1, status), notes = COALESCE($2, notes)
       WHERE id = $3
       RETURNING *`,
      [status, notes, req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

