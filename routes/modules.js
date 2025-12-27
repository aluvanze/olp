const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../uploads/modules');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Get all modules for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    // Verify course access
    if (req.user.role === 'student') {
      const enrollmentCheck = await pool.query(
        'SELECT id FROM course_enrollments WHERE student_id = $1 AND course_id = $2 AND status = $3',
        [req.user.id, req.params.courseId, 'active']
      );
      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }
    }
    
    const result = await pool.query(
      `SELECT lm.*, u.first_name as created_by_first_name, u.last_name as created_by_last_name
       FROM learning_modules lm
       LEFT JOIN users u ON lm.created_by = u.id
       WHERE lm.course_id = $1
       ORDER BY lm.module_order, lm.created_at`,
      [req.params.courseId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get module by ID with content
router.get('/:id', async (req, res) => {
  try {
    const moduleResult = await pool.query(
      `SELECT lm.*, c.course_id
       FROM learning_modules lm
       INNER JOIN courses c ON lm.course_id = c.id
       WHERE lm.id = $1`,
      [req.params.id]
    );
    
    if (moduleResult.rows.length === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    const module = moduleResult.rows[0];
    
    // Students can only see published modules
    if (req.user.role === 'student' && !module.is_published) {
      return res.status(403).json({ message: 'Module not published' });
    }
    
    // Verify course access for students
    if (req.user.role === 'student') {
      const enrollmentCheck = await pool.query(
        'SELECT id FROM course_enrollments WHERE student_id = $1 AND course_id = $2 AND status = $3',
        [req.user.id, module.course_id, 'active']
      );
      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }
    }
    
    // Get module content
    const contentResult = await pool.query(
      'SELECT * FROM module_content WHERE module_id = $1 ORDER BY display_order',
      [req.params.id]
    );
    
    module.content = contentResult.rows;
    res.json(module);
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create module (teachers and admins only)
router.post('/', authorize('teacher', 'headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    const { course_id, module_name, module_description, module_order, is_published } = req.body;
    
    // Verify course access for teachers
    if (req.user.role === 'teacher') {
      const courseCheck = await pool.query(
        'SELECT teacher_id FROM courses WHERE id = $1',
        [course_id]
      );
      if (courseCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Course not found' });
      }
      if (courseCheck.rows[0].teacher_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const result = await pool.query(
      `INSERT INTO learning_modules (course_id, module_name, module_description, module_order, is_published, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [course_id, module_name, module_description, module_order || 0, is_published || false, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update module
router.put('/:id', authorize('teacher', 'headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    // Verify module ownership for teachers
    if (req.user.role === 'teacher') {
      const moduleCheck = await pool.query(
        'SELECT created_by FROM learning_modules WHERE id = $1',
        [req.params.id]
      );
      if (moduleCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Module not found' });
      }
      if (moduleCheck.rows[0].created_by !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const { module_name, module_description, module_order, is_published } = req.body;
    
    const result = await pool.query(
      `UPDATE learning_modules 
       SET module_name = COALESCE($1, module_name),
           module_description = COALESCE($2, module_description),
           module_order = COALESCE($3, module_order),
           is_published = COALESCE($4, is_published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [module_name, module_description, module_order, is_published, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add content to module
router.post('/:id/content', 
  authorize('teacher', 'headteacher', 'deputy_headteacher'),
  upload.single('file'),
  async (req, res) => {
    try {
      const { content_type, title, content_text, display_order } = req.body;
      const module_id = req.params.id;
      
      // Verify module ownership
      if (req.user.role === 'teacher') {
        const moduleCheck = await pool.query(
          'SELECT created_by FROM learning_modules WHERE id = $1',
          [module_id]
        );
        if (moduleCheck.rows.length === 0 || moduleCheck.rows[0].created_by !== req.user.id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
      
      let content_url = null;
      let file_name = null;
      let file_size = null;
      
      if (req.file) {
        content_url = `/uploads/modules/${req.file.filename}`;
        file_name = req.file.originalname;
        file_size = req.file.size;
      } else if (content_type === 'link') {
        content_url = req.body.content_url;
      }
      
      const result = await pool.query(
        `INSERT INTO module_content (module_id, content_type, title, content_text, content_url, file_name, file_size, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [module_id, content_type, title, content_text || null, content_url, file_name, file_size, display_order || 0]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Add module content error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete module content
router.delete('/content/:contentId', authorize('teacher', 'headteacher', 'deputy_headteacher'), async (req, res) => {
  try {
    // Verify ownership
    const contentCheck = await pool.query(
      `SELECT lm.created_by 
       FROM module_content mc
       INNER JOIN learning_modules lm ON mc.module_id = lm.id
       WHERE mc.id = $1`,
      [req.params.contentId]
    );
    
    if (contentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    if (req.user.role === 'teacher' && contentCheck.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete file if exists
    const contentResult = await pool.query('SELECT content_url FROM module_content WHERE id = $1', [req.params.contentId]);
    if (contentResult.rows[0]?.content_url) {
      const filePath = path.join(__dirname, '..', contentResult.rows[0].content_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await pool.query('DELETE FROM module_content WHERE id = $1', [req.params.contentId]);
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete module content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

