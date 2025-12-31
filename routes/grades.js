const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get grades for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { student_id, grade_type } = req.query;
    
    let query = `
      SELECT g.*, u.first_name, u.last_name, u.email, a.title as assignment_title
      FROM grades g
      INNER JOIN users u ON g.student_id = u.id
      LEFT JOIN assignments a ON g.assignment_id = a.id
      WHERE g.course_id = $1
    `;
    const params = [req.params.courseId];
    let paramCount = 2;
    
    // Students can only see their own grades
    if (req.user.role === 'student') {
      query += ` AND g.student_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (student_id) {
      query += ` AND g.student_id = $${paramCount}`;
      params.push(student_id);
      paramCount++;
    }
    
    if (grade_type) {
      query += ` AND g.grade_type = $${paramCount}`;
      params.push(grade_type);
      paramCount++;
    }
    
    query += ' ORDER BY g.graded_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's grade summary for a course
router.get('/course/:courseId/student/:studentId/summary', async (req, res) => {
  try {
    // Verify access
    if (req.user.role === 'student' && req.user.id !== parseInt(req.params.studentId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get all grades
    const gradesResult = await pool.query(
      `SELECT g.*, a.title as assignment_title, a.total_points as assignment_total_points
       FROM grades g
       LEFT JOIN assignments a ON g.assignment_id = a.id
       WHERE g.course_id = $1 AND g.student_id = $2
       ORDER BY g.grade_type, g.graded_at`,
      [req.params.courseId, req.params.studentId]
    );
    
    // Get final grade if exists
    const finalGradeResult = await pool.query(
      `SELECT * FROM final_grades WHERE course_id = $1 AND student_id = $2`,
      [req.params.courseId, req.params.studentId]
    );
    
    // Calculate current average
    const grades = gradesResult.rows;
    let totalPoints = 0;
    let earnedPoints = 0;
    
    grades.forEach(grade => {
      totalPoints += parseFloat(grade.points_possible);
      earnedPoints += parseFloat(grade.points_earned);
    });
    
    const currentAverage = totalPoints > 0 ? (earnedPoints / totalPoints * 100) : 0;
    
    res.json({
      grades: grades,
      finalGrade: finalGradeResult.rows[0] || null,
      currentAverage: parseFloat(currentAverage.toFixed(2)),
      totalPoints: totalPoints,
      earnedPoints: earnedPoints
    });
  } catch (error) {
    console.error('Get grade summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Grade an assignment (teachers and admins)
router.post('/grade', authorize('teacher', 'headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    const { student_id, course_id, assignment_id, points_earned, points_possible, comments, grade_type } = req.body;
    
    // Verify course access for teachers
    if (req.user.role === 'teacher') {
      const courseCheck = await pool.query('SELECT teacher_id FROM courses WHERE id = $1', [course_id]);
      if (courseCheck.rows.length === 0 || courseCheck.rows[0].teacher_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Calculate percentage and letter grade
    const percentage = (points_earned / points_possible) * 100;
    
    // Get letter grade from grade scale
    const gradeScaleResult = await pool.query(
      `SELECT letter_grade, gpa_points FROM grade_scale 
       WHERE $1 >= min_percentage AND $1 <= max_percentage AND is_active = true
       ORDER BY min_percentage DESC LIMIT 1`,
      [percentage]
    );
    
    const letterGrade = gradeScaleResult.rows[0]?.letter_grade || 'F';
    
    // Check if grade already exists
    const existingGrade = await pool.query(
      `SELECT id FROM grades 
       WHERE student_id = $1 AND course_id = $2 AND assignment_id = $3`,
      [student_id, course_id, assignment_id || null]
    );
    
    let result;
    if (existingGrade.rows.length > 0) {
      // Update existing grade
      result = await pool.query(
        `UPDATE grades 
         SET points_earned = $1, points_possible = $2, percentage = $3, letter_grade = $4,
             comments = $5, graded_by = $6, graded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [points_earned, points_possible, percentage, letterGrade, comments || null, req.user.id,
         existingGrade.rows[0].id]
      );
    } else {
      // Insert new grade
      result = await pool.query(
        `INSERT INTO grades (student_id, course_id, assignment_id, grade_type, points_earned, 
                             points_possible, percentage, letter_grade, comments, graded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [student_id, course_id, assignment_id || null, grade_type || 'assignment', points_earned, 
         points_possible, percentage, letterGrade, comments || null, req.user.id]
      );
    }
    
    // Update submission status if assignment exists
    if (assignment_id) {
      await pool.query(
        `UPDATE assignment_submissions SET status = 'graded' 
         WHERE assignment_id = $1 AND student_id = $2`,
        [assignment_id, student_id]
      );
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Grade assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate and set final grade for a course (Grading Center)
router.post('/course/:courseId/final-grade', authorize('teacher', 'headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    const { student_id } = req.body;
    const course_id = req.params.courseId;
    
    // Verify course access
    if (req.user.role === 'teacher') {
      const courseCheck = await pool.query('SELECT teacher_id FROM courses WHERE id = $1', [course_id]);
      if (courseCheck.rows.length === 0 || courseCheck.rows[0].teacher_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Get all grades for the student in this course
    const gradesResult = await pool.query(
      `SELECT points_earned, points_possible FROM grades 
       WHERE course_id = $1 AND student_id = $2`,
      [course_id, student_id]
    );
    
    if (gradesResult.rows.length === 0) {
      return res.status(400).json({ message: 'No grades found for this student' });
    }
    
    // Calculate final percentage
    let totalPoints = 0;
    let earnedPoints = 0;
    
    gradesResult.rows.forEach(grade => {
      totalPoints += parseFloat(grade.points_possible);
      earnedPoints += parseFloat(grade.points_earned);
    });
    
    const finalPercentage = totalPoints > 0 ? (earnedPoints / totalPoints * 100) : 0;
    
    // Get letter grade and GPA
    const gradeScaleResult = await pool.query(
      `SELECT letter_grade, gpa_points FROM grade_scale 
       WHERE $1 >= min_percentage AND $1 <= max_percentage AND is_active = true
       ORDER BY min_percentage DESC LIMIT 1`,
      [finalPercentage]
    );
    
    const letterGrade = gradeScaleResult.rows[0]?.letter_grade || 'F';
    const gpaPoints = gradeScaleResult.rows[0]?.gpa_points || 0;
    
    // Insert or update final grade
    const result = await pool.query(
      `INSERT INTO final_grades (student_id, course_id, final_percentage, letter_grade, gpa_points, approved_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (student_id, course_id)
       DO UPDATE SET final_percentage = EXCLUDED.final_percentage,
                     letter_grade = EXCLUDED.letter_grade,
                     gpa_points = EXCLUDED.gpa_points,
                     calculated_at = CURRENT_TIMESTAMP,
                     approved_by = EXCLUDED.approved_by,
                     approved_at = CASE WHEN approved_by IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END
       RETURNING *`,
      [student_id, course_id, finalPercentage, letterGrade, gpaPoints, req.user.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Calculate final grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get grading center view (all students with grades for a course)
router.get('/course/:courseId/grading-center', authorize('teacher', 'headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    const course_id = req.params.courseId;
    
    // Verify course access
    if (req.user.role === 'teacher') {
      const courseCheck = await pool.query('SELECT teacher_id FROM courses WHERE id = $1', [course_id]);
      if (courseCheck.rows.length === 0 || courseCheck.rows[0].teacher_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Get all enrolled students
    const studentsResult = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email
       FROM users u
       INNER JOIN course_enrollments ce ON u.id = ce.student_id
       WHERE ce.course_id = $1 AND ce.status = 'active'
       ORDER BY u.last_name, u.first_name`,
      [course_id]
    );
    
    // Get grades and final grades for each student
    const studentsWithGrades = await Promise.all(
      studentsResult.rows.map(async (student) => {
        const gradesResult = await pool.query(
          `SELECT * FROM grades WHERE course_id = $1 AND student_id = $2`,
          [course_id, student.id]
        );
        
        const finalGradeResult = await pool.query(
          `SELECT * FROM final_grades WHERE course_id = $1 AND student_id = $2`,
          [course_id, student.id]
        );
        
        // Calculate current average
        let totalPoints = 0;
        let earnedPoints = 0;
        gradesResult.rows.forEach(grade => {
          totalPoints += parseFloat(grade.points_possible);
          earnedPoints += parseFloat(grade.points_earned);
        });
        const currentAverage = totalPoints > 0 ? (earnedPoints / totalPoints * 100) : 0;
        
        return {
          ...student,
          grades: gradesResult.rows,
          finalGrade: finalGradeResult.rows[0] || null,
          currentAverage: parseFloat(currentAverage.toFixed(2)),
          totalPoints: totalPoints,
          earnedPoints: earnedPoints
        };
      })
    );
    
    res.json(studentsWithGrades);
  } catch (error) {
    console.error('Get grading center error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

