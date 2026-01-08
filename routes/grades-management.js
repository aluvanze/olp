const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all grades (Superadmin only)
router.get('/', authorize('superadmin'), async (req, res) => {
  try {
    const { is_active } = req.query;
    
    let query = 'SELECT id, grade_number, name, description, is_active, created_at, updated_at FROM grade_levels WHERE 1=1';
    const params = [];
    
    if (is_active !== undefined) {
      query += ' AND is_active = $1';
      params.push(is_active === 'true');
    }
    
    query += ' ORDER BY grade_number';
    
    const result = await pool.query(query, params.length > 0 ? params : null);
    res.json(result.rows);
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get grade by ID
router.get('/:id', authorize('superadmin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, grade_number, name, description, is_active, created_at, updated_at FROM grade_levels WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new grade (Superadmin only)
router.post('/', authorize('superadmin'), async (req, res) => {
  try {
    const { grade_number, name, description } = req.body;
    
    if (!grade_number || !name) {
      return res.status(400).json({ message: 'grade_number and name are required' });
    }
    
    // Validate grade_number is a positive integer
    if (!Number.isInteger(grade_number) || grade_number < 1) {
      return res.status(400).json({ message: 'grade_number must be a positive integer' });
    }
    
    const result = await pool.query(
      `INSERT INTO grade_levels (grade_number, name, description, is_active, created_by)
       VALUES ($1, $2, $3, true, $4)
       RETURNING id, grade_number, name, description, is_active, created_at`,
      [grade_number, name, description || null, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ message: 'Grade with this number already exists' });
    }
    console.error('Create grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update grade (Superadmin only)
router.put('/:id', authorize('superadmin'), async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    
    const updateFields = [];
    const params = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }
    
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      params.push(is_active);
      paramCount++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(req.params.id);
    
    const result = await pool.query(
      `UPDATE grade_levels 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, grade_number, name, description, is_active, updated_at`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete grade (soft delete by setting is_active to false) (Superadmin only)
router.delete('/:id', authorize('superadmin'), async (req, res) => {
  try {
    // Check if grade has associated courses
    const coursesCheck = await pool.query(
      'SELECT COUNT(*) as count FROM courses WHERE grade_id = $1 AND is_active = true',
      [req.params.id]
    );
    
    if (parseInt(coursesCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete grade with active courses. Deactivate courses first or set grade to inactive.' 
      });
    }
    
    const result = await pool.query(
      `UPDATE grade_levels 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, grade_number, name, is_active`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    res.json({ message: 'Grade deactivated successfully', grade: result.rows[0] });
  } catch (error) {
    console.error('Delete grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

