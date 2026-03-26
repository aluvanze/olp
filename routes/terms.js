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

// Get fee setting for a term
router.get('/:id/fee', authorize('headteacher', 'superadmin', 'deputy_headteacher', 'finance'), async (req, res) => {
  try {
    const termId = parseInt(req.params.id, 10);
    if (Number.isNaN(termId)) return res.status(400).json({ message: 'Invalid term id' });

    const result = await pool.query(
      `SELECT tfs.id, tfs.term_id, tfs.amount, tfs.currency, tfs.created_at, tfs.updated_at
       FROM term_fee_settings tfs
       WHERE tfs.term_id = $1`,
      [termId]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Get term fee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set/update fee setting for a term
router.put('/:id/fee', authorize('headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const termId = parseInt(req.params.id, 10);
    const { amount, currency } = req.body || {};
    if (Number.isNaN(termId)) return res.status(400).json({ message: 'Invalid term id' });
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: 'Amount must be a positive number' });

    // Ensure term exists
    const termCheck = await pool.query('SELECT id FROM terms WHERE id = $1', [termId]);
    if (termCheck.rows.length === 0) return res.status(404).json({ message: 'Term not found' });

    const result = await pool.query(
      `INSERT INTO term_fee_settings (term_id, amount, currency, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (term_id)
       DO UPDATE SET amount = EXCLUDED.amount,
                     currency = EXCLUDED.currency,
                     updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [termId, amt, (currency || 'KES').toUpperCase(), req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Set term fee error:', error);
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

// Get all users in a term (Headteacher/Superadmin)
router.get('/:id/users', authorize('headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const { id: termId } = req.params;
    const { role, search } = req.query;
    
    // Verify term exists
    const termCheck = await pool.query('SELECT id, name, academic_year FROM terms WHERE id = $1', [termId]);
    if (termCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Term not found' });
    }
    
    let query = `
      SELECT 
        u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.phone, u.is_active,
        ut.id as user_term_id, ut.notes, ut.created_at as added_at,
        adder.first_name as added_by_first_name, adder.last_name as added_by_last_name
      FROM user_terms ut
      INNER JOIN users u ON ut.user_id = u.id
      LEFT JOIN users adder ON ut.added_by = adder.id
      WHERE ut.term_id = $1
    `;
    
    const params = [termId];
    let paramCount = 2;
    
    if (role) {
      query += ` AND u.role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }
    
    if (search) {
      query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ' ORDER BY u.role, u.last_name, u.first_name';
    
    const result = await pool.query(query, params);
    
    res.json({
      term: termCheck.rows[0],
      users: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get term users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add users to a term (Headteacher/Superadmin)
router.post('/:id/users', authorize('headteacher', 'superadmin'), async (req, res) => {
  try {
    const { id: termId } = req.params;
    const { user_ids, notes } = req.body; // user_ids is an array of user IDs
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ message: 'user_ids array is required and must not be empty' });
    }
    
    // Verify term exists
    const termCheck = await pool.query('SELECT id, name, academic_year FROM terms WHERE id = $1', [termId]);
    if (termCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Term not found' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const addedUsers = [];
      const skippedUsers = [];
      
      for (const userId of user_ids) {
        // Verify user exists
        const userCheck = await client.query(
          'SELECT id, username, first_name, last_name, role FROM users WHERE id = $1 AND is_active = true',
          [userId]
        );
        
        if (userCheck.rows.length === 0) {
          skippedUsers.push({ user_id: userId, reason: 'User not found or inactive' });
          continue;
        }
        
        // Check if user is already in this term
        const existingCheck = await client.query(
          'SELECT id FROM user_terms WHERE user_id = $1 AND term_id = $2',
          [userId, termId]
        );
        
        if (existingCheck.rows.length > 0) {
          skippedUsers.push({ 
            user_id: userId, 
            user: userCheck.rows[0],
            reason: 'User already in this term' 
          });
          continue;
        }
        
        // Add user to term
        try {
          const result = await client.query(
            `INSERT INTO user_terms (user_id, term_id, added_by, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [userId, termId, req.user.id, notes || null]
          );
          
          addedUsers.push({
            user_term_id: result.rows[0].id,
            user: userCheck.rows[0]
          });
        } catch (insertError) {
          if (insertError.code === '23505') { // Unique constraint violation
            skippedUsers.push({ 
              user_id: userId, 
              user: userCheck.rows[0],
              reason: 'User already in this term' 
            });
          } else {
            throw insertError;
          }
        }
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        message: 'Users added to term successfully',
        term: termCheck.rows[0],
        added: addedUsers,
        skipped: skippedUsers,
        summary: {
          total_requested: user_ids.length,
          added: addedUsers.length,
          skipped: skippedUsers.length
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Add users to term error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove a user from a term (Headteacher/Superadmin)
router.delete('/:id/users/:userId', authorize('headteacher', 'superadmin'), async (req, res) => {
  try {
    const { id: termId, userId } = req.params;
    
    // Verify term exists
    const termCheck = await pool.query('SELECT id, name FROM terms WHERE id = $1', [termId]);
    if (termCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Term not found' });
    }
    
    // Get user info before deletion
    const userCheck = await pool.query(
      'SELECT id, username, first_name, last_name, role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove user from term
    const result = await pool.query(
      'DELETE FROM user_terms WHERE term_id = $1 AND user_id = $2 RETURNING id',
      [termId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User is not associated with this term' });
    }
    
    res.json({
      message: 'User removed from term successfully',
      term: termCheck.rows[0],
      user: userCheck.rows[0]
    });
  } catch (error) {
    console.error('Remove user from term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

