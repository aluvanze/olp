const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorize('headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = 'SELECT id, username, email, first_name, last_name, role, phone, is_active, created_at FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (role) {
      query += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }
    
    if (search) {
      query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    // Users can view their own profile, admins can view anyone
    const canView = req.user.id === parseInt(req.params.id) || 
                   ['headteacher', 'deputy_headteacher', 'teacher'].includes(req.user.role);
    
    if (!canView) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, role, phone, 
              address, date_of_birth, profile_image_url, is_active, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get students for a parent
router.get('/parent/:parentId/students', async (req, res) => {
  try {
    // Verify parent access
    if (req.user.role !== 'parent' && req.user.id !== parseInt(req.params.parentId)) {
      if (!['headteacher', 'deputy_headteacher'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.phone, u.date_of_birth
       FROM users u
       INNER JOIN parent_student_relationships psr ON u.id = psr.student_id
       WHERE psr.parent_id = $1`,
      [req.params.parentId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get parent students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    // Users can update their own profile, admins can update anyone
    const canUpdate = req.user.id === parseInt(req.params.id) || 
                     ['headteacher', 'deputy_headteacher'].includes(req.user.role);
    
    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { first_name, last_name, phone, address, date_of_birth } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           date_of_birth = COALESCE($5, date_of_birth),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, username, email, first_name, last_name, role, phone, address, date_of_birth`,
      [first_name, last_name, phone, address, date_of_birth, req.params.id]
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

