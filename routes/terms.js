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

module.exports = router;

