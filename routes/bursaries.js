const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const uploadDir = path.join(process.cwd(), 'uploads', 'bursaries');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const safe = (file.originalname || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

router.get('/my-applications', authorize('parent', 'finance', 'headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'parent') {
      const result = await pool.query(
        `SELECT ba.*,
                u.first_name AS learner_first_name, u.last_name AS learner_last_name
         FROM bursary_applications ba
         LEFT JOIN learner_profiles lp ON ba.learner_id = lp.id
         LEFT JOIN users u ON lp.user_id = u.id
         WHERE ba.parent_id = $1
         ORDER BY ba.created_at DESC`,
        [req.user.id]
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        `SELECT ba.*,
                up.first_name AS parent_first_name, up.last_name AS parent_last_name,
                ul.first_name AS learner_first_name, ul.last_name AS learner_last_name
         FROM bursary_applications ba
         LEFT JOIN users up ON ba.parent_id = up.id
         LEFT JOIN learner_profiles lp ON ba.learner_id = lp.id
         LEFT JOIN users ul ON lp.user_id = ul.id
         ORDER BY ba.created_at DESC`
      );
      rows = result.rows;
    }
    res.json(rows);
  } catch (error) {
    console.error('Get bursary applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/apply', authorize('parent'), upload.array('documents', 10), async (req, res) => {
  try {
    const learnerId = parseInt(req.body.learner_id, 10);
    const amount = parseFloat(req.body.amount_requested);
    const reason = (req.body.reason || '').toString().trim();
    if (!learnerId || Number.isNaN(learnerId)) return res.status(400).json({ message: 'Learner is required' });
    if (!amount || Number.isNaN(amount) || amount <= 0) return res.status(400).json({ message: 'Valid amount is required' });
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const check = await pool.query('SELECT id FROM learner_profiles WHERE id = $1 AND parent_id = $2', [learnerId, req.user.id]);
    if (check.rows.length === 0) return res.status(403).json({ message: 'Access denied for learner' });

    const docs = (req.files || []).map((f) => ({
      original_name: f.originalname,
      file_name: f.filename,
      path: `/uploads/bursaries/${f.filename}`,
      mime_type: f.mimetype,
      size: f.size
    }));

    const result = await pool.query(
      `INSERT INTO bursary_applications (learner_id, parent_id, amount_requested, supporting_docs, headteacher_notes, status)
       VALUES ($1, $2, $3, $4::jsonb, $5, 'pending')
       RETURNING *`,
      [learnerId, req.user.id, amount, JSON.stringify(docs), reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Apply bursary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
