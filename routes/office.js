const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const OFFICE_ROLES = ['sub_county_office', 'county_office', 'national_office', 'superadmin'];

// Analytics & Insights (aggregated performance)
router.get('/analytics/overview', authorize(...OFFICE_ROLES), async (req, res) => {
  try {
    const { scope = 'national', county, sub_county, term, academic_year } = req.query;

    const where = [];
    const params = [];
    let p = 1;

    if (scope === 'county' && county) {
      where.push(`s.county = $${p++}`);
      params.push(county);
    }
    if (scope === 'sub_county' && sub_county) {
      where.push(`s.sub_county = $${p++}`);
      params.push(sub_county);
    }
    if (term) {
      where.push(`rs.term = $${p++}`);
      params.push(term);
    }
    if (academic_year) {
      where.push(`rs.academic_year = $${p++}`);
      params.push(academic_year);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // By learning area (trend-ready aggregates)
    const byLearningArea = await pool.query(
      `SELECT la.id AS learning_area_id, la.name AS learning_area_name, la.code AS learning_area_code,
              AVG(rsd.final_score) AS avg_final_score,
              AVG(rsd.average_formative_score) AS avg_formative_score,
              AVG(rsd.summative_score) AS avg_summative_raw_score,
              COUNT(DISTINCT rs.learner_id) AS learners_count,
              COUNT(DISTINCT s.id) AS schools_count
       FROM result_slips rs
       INNER JOIN learner_profiles lp ON rs.learner_id = lp.id
       INNER JOIN schools s ON lp.school_id = s.id
       INNER JOIN result_slip_details rsd ON rs.id = rsd.result_slip_id
       INNER JOIN learning_areas la ON rsd.learning_area_id = la.id
       ${whereSql}
       GROUP BY la.id, la.name, la.code
       ORDER BY la.name`,
      params
    );

    // School heatmap: school avg score + learners
    const schoolHeatmap = await pool.query(
      `SELECT s.id AS school_id, s.name AS school_name, s.county, s.sub_county,
              AVG(rsd.final_score) AS avg_final_score,
              COUNT(DISTINCT rs.learner_id) AS learners_count
       FROM result_slips rs
       INNER JOIN learner_profiles lp ON rs.learner_id = lp.id
       INNER JOIN schools s ON lp.school_id = s.id
       INNER JOIN result_slip_details rsd ON rs.id = rsd.result_slip_id
       ${whereSql}
       GROUP BY s.id, s.name, s.county, s.sub_county
       ORDER BY avg_final_score DESC NULLS LAST
       LIMIT 250`,
      params
    );

    // Trend lines across terms
    const trend = await pool.query(
      `SELECT rs.academic_year, rs.term,
              AVG(rsd.final_score) AS avg_final_score,
              COUNT(DISTINCT rs.learner_id) AS learners_count
       FROM result_slips rs
       INNER JOIN learner_profiles lp ON rs.learner_id = lp.id
       INNER JOIN schools s ON lp.school_id = s.id
       INNER JOIN result_slip_details rsd ON rs.id = rsd.result_slip_id
       ${whereSql}
       GROUP BY rs.academic_year, rs.term
       ORDER BY rs.academic_year DESC, rs.term DESC
       LIMIT 30`,
      params
    );

    res.json({
      scope,
      filters: { county: county || null, sub_county: sub_county || null, term: term || null, academic_year: academic_year || null },
      by_learning_area: byLearningArea.rows,
      school_heatmap: schoolHeatmap.rows,
      trend: trend.rows
    });
  } catch (error) {
    console.error('Office analytics overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Transfer Management
router.get('/transfers', authorize(...OFFICE_ROLES), async (req, res) => {
  try {
    const { status } = req.query;
    let q = `
      SELECT lt.*,
             lp.admission_number AS school_id,
             su.first_name AS learner_first_name, su.last_name AS learner_last_name,
             fs.name AS from_school_name, ts.name AS to_school_name
      FROM learner_transfers lt
      INNER JOIN learner_profiles lp ON lt.learner_id = lp.id
      INNER JOIN users su ON lp.user_id = su.id
      LEFT JOIN schools fs ON lt.from_school_id = fs.id
      LEFT JOIN schools ts ON lt.to_school_id = ts.id
      WHERE 1=1
    `;
    const params = [];
    let p = 1;
    if (status) {
      q += ` AND lt.status = $${p++}`;
      params.push(status);
    }
    q += ' ORDER BY lt.created_at DESC';
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/transfers/:id/decision', authorize(...OFFICE_ROLES), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { decision } = req.body || {}; // 'approved' | 'rejected' | 'completed'
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid transfer ID' });
    if (!['approved', 'rejected', 'completed'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be approved, rejected, or completed' });
    }
    const result = await pool.query(
      `UPDATE learner_transfers
       SET status = $1,
           approved_by = CASE WHEN $1 IN ('approved','rejected') THEN $2 ELSE approved_by END,
           approval_date = CASE WHEN $1 IN ('approved','rejected') THEN CURRENT_DATE ELSE approval_date END,
           transfer_date = CASE WHEN $1 = 'completed' THEN CURRENT_DATE ELSE transfer_date END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [decision, req.user.id, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Transfer not found' });
    res.json({ message: `Transfer ${decision}`, transfer: result.rows[0] });
  } catch (error) {
    console.error('Transfer decision error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bursary & Capitation Oversight
router.get('/funds/overview', authorize(...OFFICE_ROLES), async (req, res) => {
  try {
    const bursary = await pool.query(
      `SELECT status, COUNT(*) AS applications_count, SUM(amount_requested) AS total_requested
       FROM bursary_applications
       GROUP BY status
       ORDER BY status`
    );

    // Capitation table is created lazily by finance routes; handle if missing
    let capitation = { total_received: 0, records_count: 0 };
    try {
      const cap = await pool.query(`SELECT COUNT(*) AS records_count, SUM(amount_received) AS total_received FROM capitation_funds`);
      capitation = cap.rows[0] || capitation;
    } catch (_) {
      // ignore missing table
    }

    res.json({ bursary: bursary.rows, capitation });
  } catch (error) {
    console.error('Funds overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// School Classification / Tagging
router.get('/schools/tags', authorize(...OFFICE_ROLES), async (req, res) => {
  try {
    const { school_id } = req.query;
    let q = `SELECT st.*, s.name AS school_name FROM school_tags st INNER JOIN schools s ON st.school_id = s.id WHERE 1=1`;
    const params = [];
    let p = 1;
    if (school_id) {
      q += ` AND st.school_id = $${p++}`;
      params.push(school_id);
    }
    q += ' ORDER BY st.created_at DESC';
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get school tags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/schools/tags', authorize(...OFFICE_ROLES), async (req, res) => {
  try {
    const { school_id, tag_type, tag_value, notes } = req.body || {};
    if (!school_id || !tag_type || !tag_value) {
      return res.status(400).json({ message: 'school_id, tag_type, and tag_value are required' });
    }
    const result = await pool.query(
      `INSERT INTO school_tags (school_id, tag_type, tag_value, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (school_id, tag_type, tag_value)
       DO UPDATE SET notes = EXCLUDED.notes
       RETURNING *`,
      [school_id, String(tag_type).trim(), String(tag_value).trim(), notes || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create school tag error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

