const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all terms (for admin management)
router.get('/', authorize('headteacher', 'superadmin'), async (req, res) => {
  try {
    const { academic_year } = req.query;
    
    let query = 'SELECT * FROM terms WHERE 1=1';
    const params = [];
    
    if (academic_year) {
      query += ' AND academic_year = $1';
      params.push(academic_year);
      query += ' ORDER BY term_number';
    } else {
      query += ' ORDER BY academic_year DESC, term_number';
    }
    
    const result = await pool.query(query, params.length > 0 ? params : null);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all terms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get term by ID
router.get('/:id', authorize('headteacher', 'superadmin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM terms WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Term not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create term
router.post('/', authorize('headteacher', 'superadmin'), async (req, res) => {
  try {
    const { term_number, academic_year, name, date_range_start, date_range_end, start_date, end_date } = req.body;
    
    // Validate required fields
    if (!term_number || !academic_year || !name || !date_range_start || !date_range_end) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate term number
    if (term_number < 1 || term_number > 3) {
      return res.status(400).json({ message: 'Term number must be between 1 and 3' });
    }
    
    const result = await pool.query(
      `INSERT INTO terms (term_number, academic_year, name, date_range_start, date_range_end, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [term_number, academic_year, name, date_range_start, date_range_end, start_date || null, end_date || null, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ message: 'Term already exists for this academic year' });
    }
    console.error('Create term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update term
router.put('/:id', authorize('headteacher', 'superadmin'), async (req, res) => {
  try {
    const { name, date_range_start, date_range_end, start_date, end_date, is_active } = req.body;
    
    const result = await pool.query(
      `UPDATE terms 
       SET name = COALESCE($1, name),
           date_range_start = COALESCE($2, date_range_start),
           date_range_end = COALESCE($3, date_range_end),
           start_date = $4,
           end_date = $5,
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, date_range_start, date_range_end, start_date || null, end_date || null, is_active, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Term not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete term (soft delete by setting is_active to false)
router.delete('/:id', authorize('headteacher', 'superadmin'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE terms SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Term not found' });
    }
    
    res.json({ message: 'Term deactivated successfully', term: result.rows[0] });
  } catch (error) {
    console.error('Delete term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Migrate structure from previous term (learning areas, curriculum, teacher assignments)
// Does NOT migrate student data (enrollments, grades, attendance)
router.post('/:id/migrate-structure', authorize('headteacher', 'superadmin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id: targetTermId } = req.params;
    const { source_term_id } = req.body;
    
    if (!source_term_id) {
      return res.status(400).json({ message: 'Source term ID is required' });
    }
    
    // Get source and target terms
    const sourceTermResult = await client.query('SELECT * FROM terms WHERE id = $1', [source_term_id]);
    const targetTermResult = await client.query('SELECT * FROM terms WHERE id = $1', [targetTermId]);
    
    if (sourceTermResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Source term not found' });
    }
    
    if (targetTermResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Target term not found' });
    }
    
    const sourceTerm = sourceTermResult.rows[0];
    const targetTerm = targetTermResult.rows[0];
    
    // Get all courses (learning areas) from source term's academic year
    const sourceCourses = await client.query(
      `SELECT c.*, la.strands, la.rubrics
       FROM courses c
       LEFT JOIN learning_areas la ON c.learning_area_id = la.id
       WHERE c.academic_year = $1 AND c.is_active = true`,
      [sourceTerm.academic_year]
    );
    
    let migratedCount = 0;
    
    // Migrate each course (learning area) to the new academic year
    for (const sourceCourse of sourceCourses.rows) {
      // Check if course already exists for target academic year
      const existingCourse = await client.query(
        'SELECT id FROM courses WHERE course_code = $1 AND academic_year = $2',
        [sourceCourse.course_code, targetTerm.academic_year]
      );
      
      if (existingCourse.rows.length > 0) {
        // Course already exists, skip
        continue;
      }
      
      // Create new course for target academic year
      const newCourseResult = await client.query(
        `INSERT INTO courses (course_code, course_name, description, academic_year, learning_area_id, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING id`,
        [
          sourceCourse.course_code,
          sourceCourse.course_name,
          sourceCourse.description,
          targetTerm.academic_year,
          sourceCourse.learning_area_id,
          true
        ]
      );
      
      const newCourseId = newCourseResult.rows[0].id;
      migratedCount++;
      
      // Migrate teacher assignments for this course from source term to target term
      const sourceAssignments = await client.query(
        `SELECT tca.*
         FROM teacher_course_assignments tca
         WHERE tca.course_id = $1 AND tca.term_number = $2 AND tca.academic_year = $3 AND tca.is_active = true`,
        [sourceCourse.id, sourceTerm.term_number, sourceTerm.academic_year]
      );
      
      for (const assignment of sourceAssignments.rows) {
        // Create teacher assignment for target term
        await client.query(
          `INSERT INTO teacher_course_assignments (course_id, teacher_id, term_number, academic_year, assigned_by, is_active, assigned_at)
           VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)
           ON CONFLICT (course_id, teacher_id, term_number, academic_year) DO NOTHING`,
          [
            newCourseId,
            assignment.teacher_id,
            targetTerm.term_number,
            targetTerm.academic_year,
            req.user.id
          ]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Structure migrated successfully',
      migrated_courses: migratedCount,
      note: 'Student data (enrollments, grades, attendance) was NOT migrated'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migrate structure error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;

