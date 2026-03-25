const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { username, password } = req.body;
      
      // Find user by username or email
      const result = await pool.query(
        'SELECT id, username, email, password_hash, role, first_name, last_name, is_active FROM users WHERE username = $1 OR email = $1',
        [username]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      const user = result.rows[0];
      
      if (!user.is_active) {
        return res.status(401).json({ message: 'Account is inactive. Please contact administrator.' });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Get available grades for the user
      let gradesResult;
      try {
        gradesResult = await pool.query(
          'SELECT id, grade_number, name, description FROM grade_levels WHERE is_active = true ORDER BY grade_number'
        );
      } catch (gradeError) {
        console.error('Error fetching grades:', gradeError);
        gradesResult = { rows: [] };
      }
      
      // Generate JWT token (without grade_id initially - user will select grade)
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not set in environment variables');
        return res.status(500).json({ message: 'Server configuration error' });
      }
      
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      // Require grade selection only for roles that need grade context
      // Parents/Finance should not be blocked by grade selection
      const requiresGradeSelection = gradesResult.rows.length > 0 && !['parent', 'finance', 'sub_county_office', 'county_office', 'national_office'].includes(user.role);
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        },
        available_grades: gradesResult.rows,
        requires_grade_selection: requiresGradeSelection
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// Get available grades
router.get('/grades', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, grade_number, name, description FROM grade_levels WHERE is_active = true ORDER BY grade_number'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Select grade and update token
router.post('/select-grade', authenticate, async (req, res) => {
  try {
    const { grade_id } = req.body;
    
    if (!grade_id) {
      return res.status(400).json({ message: 'grade_id is required' });
    }
    
    // Verify grade exists and is active
    const gradeResult = await pool.query(
      'SELECT id, grade_number, name, description FROM grade_levels WHERE id = $1 AND is_active = true',
      [grade_id]
    );
    
    if (gradeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Grade not found or inactive' });
    }
    
    const grade = gradeResult.rows[0];
    
    // Generate new token with grade_id included
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const token = jwt.sign(
      { userId: req.user.id, role: req.user.role, grade_id: grade.id, grade_number: grade.grade_number },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      message: 'Grade selected successfully',
      token,
      grade: grade
    });
  } catch (error) {
    console.error('Select grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, role, phone, 
              address, date_of_birth, profile_image_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Include grade information if available in token
    if (req.user.grade_id) {
      const gradeResult = await pool.query(
        'SELECT id, grade_number, name, description FROM grade_levels WHERE id = $1',
        [req.user.grade_id]
      );
      user.current_grade = gradeResult.rows[0] || null;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.post('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      // Get current password hash
      const result = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
      );
      
      const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, req.user.id]
      );
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Activate account using emailed activation token
router.post('/activate-account', [
  body('token').notEmpty().withMessage('Activation token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token, newPassword } = req.body;
    const userResult = await pool.query(
      `SELECT id, verification_token_expires
       FROM users
       WHERE verification_token = $1 AND role = 'teacher'`,
      [token]
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid activation token' });
    }

    const user = userResult.rows[0];
    if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
      return res.status(400).json({ message: 'Activation token has expired' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           is_verified = true,
           is_active = true,
           verification_token = NULL,
           verification_token_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    res.json({ message: 'Account activated successfully. You can now log in.' });
  } catch (error) {
    console.error('Activate account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

