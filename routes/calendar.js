const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/events', authorize('student', 'teacher', 'parent', 'finance', 'headteacher', 'deputy_headteacher', 'superadmin'), async (_req, res) => {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS school_events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        event_type VARCHAR(50) DEFAULT 'general',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );

    const [eventsResult, termsResult] = await Promise.all([
      pool.query('SELECT id, title, description, event_date, event_type FROM school_events ORDER BY event_date ASC'),
      pool.query('SELECT term_number, academic_year, start_date, end_date FROM terms WHERE is_active = true ORDER BY start_date ASC')
    ]);

    const termEvents = termsResult.rows.flatMap((t) => ([
      { id: `term-start-${t.term_number}-${t.academic_year}`, title: `Term ${t.term_number} Starts`, description: `Academic Year ${t.academic_year}`, event_date: t.start_date, event_type: 'term' },
      { id: `term-end-${t.term_number}-${t.academic_year}`, title: `Term ${t.term_number} Ends`, description: `Academic Year ${t.academic_year}`, event_date: t.end_date, event_type: 'term' }
    ]));

    const events = [...termEvents, ...eventsResult.rows].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    res.json(events);
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/events', authorize('headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const title = (req.body.title || '').toString().trim();
    const description = (req.body.description || '').toString().trim() || null;
    const eventDate = req.body.event_date;
    const eventType = (req.body.event_type || 'general').toString().trim();
    if (!title || !eventDate) return res.status(400).json({ message: 'Title and event date are required' });

    await pool.query(
      `CREATE TABLE IF NOT EXISTS school_events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        event_type VARCHAR(50) DEFAULT 'general',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );

    const result = await pool.query(
      `INSERT INTO school_events (title, description, event_date, event_type, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, event_date, event_type`,
      [title, description, eventDate, eventType, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
