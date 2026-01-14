const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get sub-strands for a learning area (by course ID or learning area ID)
router.get('/learning-area/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Try to get by course ID first, then by learning area ID
    let result = await pool.query(
      `SELECT la.strands, la.id, la.name, la.code
       FROM learning_areas la
       INNER JOIN courses c ON c.learning_area_id = la.id
       WHERE c.id = $1`,
      [id]
    );
    
    // If not found by course ID, try learning area ID directly
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT la.strands, la.id, la.name, la.code
         FROM learning_areas la
         WHERE la.id = $1`,
        [id]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Learning area not found' });
    }
    
    const learningArea = result.rows[0];
    let strands = [];
    
    if (learningArea.strands) {
      if (typeof learningArea.strands === 'string') {
        try {
          strands = JSON.parse(learningArea.strands);
        } catch (e) {
          strands = [];
        }
      } else {
        strands = learningArea.strands;
      }
    }
    
    res.json({ strands, learningArea });
  } catch (error) {
    console.error('Get sub-strands error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add sub-strand to a learning area
router.post('/learning-area/:learningAreaId/strand/:strandCode/substrand', 
  authorize('teacher', 'headteacher', 'deputy_headteacher'),
  async (req, res) => {
    try {
      const { learningAreaId, strandCode } = req.params;
      const { sub_strand_code, sub_strand_name, indicators, rubrics } = req.body;
      
      // Get current learning area
      const laResult = await pool.query(
        'SELECT strands FROM learning_areas WHERE id = $1',
        [learningAreaId]
      );
      
      if (laResult.rows.length === 0) {
        return res.status(404).json({ message: 'Learning area not found' });
      }
      
      let strands = [];
      if (laResult.rows[0].strands) {
        if (typeof laResult.rows[0].strands === 'string') {
          try {
            strands = JSON.parse(laResult.rows[0].strands);
          } catch (e) {
            strands = [];
          }
        } else {
          strands = laResult.rows[0].strands;
        }
      }
      
      // Find the strand
      const strandIndex = strands.findIndex(s => s.strand_code === strandCode);
      if (strandIndex === -1) {
        return res.status(404).json({ message: 'Strand not found' });
      }
      
      // Add sub-strand
      if (!strands[strandIndex].sub_strands) {
        strands[strandIndex].sub_strands = [];
      }
      
      const newSubStrand = {
        sub_strand_code: sub_strand_code || `SS${strands[strandIndex].sub_strands.length + 1}`,
        sub_strand_name: sub_strand_name,
        indicators: indicators || [],
        rubrics: rubrics || []
      };
      
      strands[strandIndex].sub_strands.push(newSubStrand);
      
      // Update learning area
      await pool.query(
        'UPDATE learning_areas SET strands = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(strands), learningAreaId]
      );
      
      res.status(201).json({ message: 'Sub-strand created successfully', sub_strand: newSubStrand });
    } catch (error) {
      console.error('Create sub-strand error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Update sub-strand
router.put('/learning-area/:learningAreaId/strand/:strandCode/substrand/:subStrandCode',
  authorize('teacher', 'headteacher', 'deputy_headteacher'),
  async (req, res) => {
    try {
      const { learningAreaId, strandCode, subStrandCode } = req.params;
      const { sub_strand_name, indicators, rubrics } = req.body;
      
      // Get current learning area
      const laResult = await pool.query(
        'SELECT strands FROM learning_areas WHERE id = $1',
        [learningAreaId]
      );
      
      if (laResult.rows.length === 0) {
        return res.status(404).json({ message: 'Learning area not found' });
      }
      
      let strands = [];
      if (laResult.rows[0].strands) {
        if (typeof laResult.rows[0].strands === 'string') {
          try {
            strands = JSON.parse(laResult.rows[0].strands);
          } catch (e) {
            strands = [];
          }
        } else {
          strands = laResult.rows[0].strands;
        }
      }
      
      // Find the strand and sub-strand
      const strandIndex = strands.findIndex(s => s.strand_code === strandCode);
      if (strandIndex === -1) {
        return res.status(404).json({ message: 'Strand not found' });
      }
      
      const subStrandIndex = strands[strandIndex].sub_strands?.findIndex(
        ss => ss.sub_strand_code === subStrandCode
      );
      
      if (subStrandIndex === -1) {
        return res.status(404).json({ message: 'Sub-strand not found' });
      }
      
      // Update sub-strand
      if (sub_strand_name) {
        strands[strandIndex].sub_strands[subStrandIndex].sub_strand_name = sub_strand_name;
      }
      if (indicators) {
        strands[strandIndex].sub_strands[subStrandIndex].indicators = indicators;
      }
      if (rubrics) {
        strands[strandIndex].sub_strands[subStrandIndex].rubrics = rubrics;
      }
      
      // Update learning area
      await pool.query(
        'UPDATE learning_areas SET strands = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(strands), learningAreaId]
      );
      
      res.json({ message: 'Sub-strand updated successfully' });
    } catch (error) {
      console.error('Update sub-strand error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete sub-strand
router.delete('/learning-area/:learningAreaId/strand/:strandCode/substrand/:subStrandCode',
  authorize('teacher', 'headteacher', 'deputy_headteacher'),
  async (req, res) => {
    try {
      const { learningAreaId, strandCode, subStrandCode } = req.params;
      
      // Get current learning area
      const laResult = await pool.query(
        'SELECT strands FROM learning_areas WHERE id = $1',
        [learningAreaId]
      );
      
      if (laResult.rows.length === 0) {
        return res.status(404).json({ message: 'Learning area not found' });
      }
      
      let strands = [];
      if (laResult.rows[0].strands) {
        if (typeof laResult.rows[0].strands === 'string') {
          try {
            strands = JSON.parse(laResult.rows[0].strands);
          } catch (e) {
            strands = [];
          }
        } else {
          strands = laResult.rows[0].strands;
        }
      }
      
      // Find the strand and remove sub-strand
      const strandIndex = strands.findIndex(s => s.strand_code === strandCode);
      if (strandIndex === -1) {
        return res.status(404).json({ message: 'Strand not found' });
      }
      
      if (strands[strandIndex].sub_strands) {
        strands[strandIndex].sub_strands = strands[strandIndex].sub_strands.filter(
          ss => ss.sub_strand_code !== subStrandCode
        );
      }
      
      // Update learning area
      await pool.query(
        'UPDATE learning_areas SET strands = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(strands), learningAreaId]
      );
      
      res.json({ message: 'Sub-strand deleted successfully' });
    } catch (error) {
      console.error('Delete sub-strand error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;

