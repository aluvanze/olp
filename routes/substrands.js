const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all learning areas with their substrands (for admin management)
router.get('/learning-areas', 
  authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, name, code, strands, description, created_at, updated_at
         FROM learning_areas
         ORDER BY name`
      );
      
      const learningAreas = result.rows.map(la => {
        let strands = [];
        if (la.strands) {
          if (typeof la.strands === 'string') {
            try {
              strands = JSON.parse(la.strands);
            } catch (e) {
              strands = [];
            }
          } else {
            strands = la.strands;
          }
        }
        
        // Count total substrands
        let totalSubstrands = 0;
        strands.forEach(strand => {
          if (strand.sub_strands && Array.isArray(strand.sub_strands)) {
            totalSubstrands += strand.sub_strands.length;
          }
        });
        
        return {
          ...la,
          strands,
          total_strands: strands.length,
          total_substrands: totalSubstrands
        };
      });
      
      res.json(learningAreas);
    } catch (error) {
      console.error('Get all learning areas error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

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

// Add strand to a learning area
router.post('/learning-area/:learningAreaId/strand',
  authorize('teacher', 'headteacher', 'deputy_headteacher'),
  async (req, res) => {
    try {
      console.log('=== POST /learning-area/:learningAreaId/strand ===');
      console.log('Params:', req.params);
      console.log('Body:', req.body);
      console.log('User:', req.user);
      
      const { learningAreaId } = req.params;
      const { strand_code, strand_name } = req.body;
      
      if (!strand_code || !strand_name) {
        console.error('Validation failed: Missing strand_code or strand_name');
        return res.status(400).json({ message: 'Strand code and name are required' });
      }
      
      // Get current learning area
      console.log('Querying learning area:', learningAreaId);
      const laResult = await pool.query(
        'SELECT id, name, code, strands FROM learning_areas WHERE id = $1',
        [learningAreaId]
      );
      
      console.log('Learning area query result:', laResult.rows.length, 'rows');
      
      if (laResult.rows.length === 0) {
        console.error('Learning area not found:', learningAreaId);
        return res.status(404).json({ message: 'Learning area not found' });
      }
      
      let strands = [];
      if (laResult.rows[0].strands) {
        if (typeof laResult.rows[0].strands === 'string') {
          try {
            strands = JSON.parse(laResult.rows[0].strands);
          } catch (e) {
            console.error('Error parsing strands JSON:', e);
            strands = [];
          }
        } else {
          strands = laResult.rows[0].strands;
        }
      }
      
      console.log('Current strands:', strands.length);
      
      // Check if strand code already exists
      const existingStrand = strands.find(s => s.strand_code === strand_code);
      if (existingStrand) {
        console.error('Strand code already exists:', strand_code);
        return res.status(400).json({ message: 'Strand code already exists' });
      }
      
      // Add new strand
      const newStrand = {
        strand_code: strand_code,
        strand_name: strand_name,
        sub_strands: []
      };
      
      strands.push(newStrand);
      
      console.log('New strands array length:', strands.length);
      console.log('Updating database...');
      
      // Update learning area
      const updateResult = await pool.query(
        'UPDATE learning_areas SET strands = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name',
        [JSON.stringify(strands), learningAreaId]
      );
      
      console.log('Update result:', updateResult.rows.length, 'rows updated');
      
      res.status(201).json({ message: 'Strand created successfully', strand: newStrand });
    } catch (error) {
      console.error('Create strand error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Update strand
router.put('/learning-area/:learningAreaId/strand/:strandCode',
  authorize('teacher', 'headteacher', 'deputy_headteacher'),
  async (req, res) => {
    try {
      const { learningAreaId, strandCode } = req.params;
      const { strand_code, strand_name } = req.body;
      
      if (!strand_code || !strand_name) {
        return res.status(400).json({ message: 'Strand code and name are required' });
      }
      
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
      
      // Check if new code already exists (and it's not the same strand)
      if (strand_code !== strandCode) {
        const existingStrand = strands.find(s => s.strand_code === strand_code && s !== strands[strandIndex]);
        if (existingStrand) {
          return res.status(400).json({ message: 'Strand code already exists' });
        }
      }
      
      // Update strand
      strands[strandIndex].strand_code = strand_code;
      strands[strandIndex].strand_name = strand_name;
      
      // Update learning area
      await pool.query(
        'UPDATE learning_areas SET strands = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(strands), learningAreaId]
      );
      
      res.json({ message: 'Strand updated successfully', strand: strands[strandIndex] });
    } catch (error) {
      console.error('Update strand error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Delete strand
router.delete('/learning-area/:learningAreaId/strand/:strandCode',
  authorize('teacher', 'headteacher', 'deputy_headteacher'),
  async (req, res) => {
    try {
      const { learningAreaId, strandCode } = req.params;
      
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
      
      // Find and remove the strand
      const strandIndex = strands.findIndex(s => s.strand_code === strandCode);
      if (strandIndex === -1) {
        return res.status(404).json({ message: 'Strand not found' });
      }
      
      strands.splice(strandIndex, 1);
      
      // Update learning area
      await pool.query(
        'UPDATE learning_areas SET strands = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(strands), learningAreaId]
      );
      
      res.json({ message: 'Strand deleted successfully' });
    } catch (error) {
      console.error('Delete strand error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

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

