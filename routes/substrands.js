const express = require('express');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Multer config for Excel upload (memory storage - we parse and discard)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowed = ['.xlsx', '.xls'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});
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
        if (!Array.isArray(strands)) strands = strands ? [strands] : [];
        
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

// Get sub-strands for a learning area (by learning area ID or course ID)
router.get('/learning-area/:id', async (req, res) => {
  try {
    const paramId = req.params.id;
    const idAsInt = parseInt(paramId, 10);
    
    // Try learning area ID first (used by Manage Sub-strands when clicking a learning area card)
    let result = await pool.query(
      `SELECT la.strands, la.id, la.name, la.code
       FROM learning_areas la
       WHERE la.id = $1`,
      [isNaN(idAsInt) ? paramId : idAsInt]
    );
    
    // If not found by learning area ID, try as course ID (e.g. from Learning Modules)
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT la.strands, la.id, la.name, la.code
         FROM learning_areas la
         INNER JOIN courses c ON c.learning_area_id = la.id
         WHERE c.id = $1`,
        [isNaN(idAsInt) ? paramId : idAsInt]
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
    if (!Array.isArray(strands)) strands = strands ? [strands] : [];
    
    res.json({ strands, learningArea });
  } catch (error) {
    console.error('Get sub-strands error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add strand to a learning area
router.post('/learning-area/:learningAreaId/strand',
  authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'),
  async (req, res) => {
    try {
      console.log('=== POST /learning-area/:learningAreaId/strand ===');
      console.log('Params:', req.params);
      console.log('Body:', req.body);
      console.log('User:', req.user);
      
      const { learningAreaId } = req.params;
      const strand_code = req.body.strand_code ? String(req.body.strand_code).trim() : '';
      const strand_name = req.body.strand_name ? String(req.body.strand_name).trim() : '';
      
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
      
      // Check if strand code already exists (case-insensitive, trimmed)
      const codeNorm = (c) => String(c || '').trim().toUpperCase();
      const existingStrand = strands.find(s => codeNorm(s.strand_code) === codeNorm(strand_code));
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
  authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'),
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
      
      // Find the strand (case-insensitive, trimmed)
      const codeNorm = (c) => String(c || '').trim().toUpperCase();
      const strandIndex = strands.findIndex(s => codeNorm(s.strand_code) === codeNorm(strandCode));
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
  authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'),
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
      
      // Find and remove the strand (case-insensitive, trimmed)
      const codeNorm = (c) => String(c || '').trim().toUpperCase();
      const strandIndex = strands.findIndex(s => codeNorm(s.strand_code) === codeNorm(strandCode));
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
  authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'),
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
      
      // Find the strand (case-insensitive, trimmed)
      const codeNorm = (c) => String(c || '').trim().toUpperCase();
      const strandIndex = strands.findIndex(s => codeNorm(s.strand_code) === codeNorm(strandCode));
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
  authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'),
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
      
      // Find the strand and sub-strand (case-insensitive, trimmed)
      const codeNorm = (c) => String(c || '').trim().toUpperCase();
      const strandIndex = strands.findIndex(s => codeNorm(s.strand_code) === codeNorm(strandCode));
      if (strandIndex === -1) {
        return res.status(404).json({ message: 'Strand not found' });
      }
      
      const subStrandIndex = strands[strandIndex].sub_strands?.findIndex(
        ss => codeNorm(ss.sub_strand_code) === codeNorm(subStrandCode)
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
  authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'),
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
      
      // Find the strand and remove sub-strand (case-insensitive, trimmed)
      const codeNorm = (c) => String(c || '').trim().toUpperCase();
      const strandIndex = strands.findIndex(s => codeNorm(s.strand_code) === codeNorm(strandCode));
      if (strandIndex === -1) {
        return res.status(404).json({ message: 'Strand not found' });
      }
      
      if (strands[strandIndex].sub_strands) {
        strands[strandIndex].sub_strands = strands[strandIndex].sub_strands.filter(
          ss => codeNorm(ss.sub_strand_code) !== codeNorm(subStrandCode)
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

// Import strands and sub-strands from Excel file
// Expected columns: Strand (e.g. "1.0 Crop Production"), Sub-strand (e.g. "1.1 Agricultural Land"), Rubrics
router.post('/learning-area/:learningAreaId/import-excel',
  authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'),
  upload.single('file'),
  async (req, res) => {
    try {
      const { learningAreaId } = req.params;
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: 'No file uploaded. Please select an Excel file.' });
      }

      // Verify learning area exists (and get name for response)
      const laResult = await pool.query(
        'SELECT id, name, strands FROM learning_areas WHERE id = $1',
        [learningAreaId]
      );
      if (laResult.rows.length === 0) {
        return res.status(404).json({ message: 'Learning area not found' });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (!rows || rows.length < 2) {
        return res.status(400).json({ message: 'Excel file must have a header row and at least one data row.' });
      }

      // Detect column indices (flexible: match by header or use A=0, B=1, C=2)
      const headerRow = rows[0].map(c => String(c || '').trim().toLowerCase());
      const strandCol = headerRow.findIndex(h => h.includes('strand') && !h.includes('sub'));
      const subStrandCol = headerRow.findIndex(h => h.includes('sub') && h.includes('strand'));
      const rubricCol = headerRow.findIndex(h => h.includes('rubric'));

      const colStrand = strandCol >= 0 ? strandCol : 0;
      const colSubStrand = subStrandCol >= 0 ? subStrandCol : 1;
      const colRubric = rubricCol >= 0 ? rubricCol : 2;

      // Parse rows into strands > sub_strands > rubrics
      let currentStrandCode = null;
      let currentStrandName = null;
      let currentSubStrandCode = null;
      let currentSubStrandName = null;
      const strandsMap = new Map(); // strand_code -> { strand_code, strand_name, sub_strands: Map }

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!Array.isArray(row)) continue;

        const strandVal = String(row[colStrand] ?? '').trim();
        const subStrandVal = String(row[colSubStrand] ?? '').trim();
        const rubricVal = String(row[colRubric] ?? '').trim();

        if (strandVal) {
          const match = strandVal.match(/^([\d.]+)\s+(.+)$/);
          currentStrandCode = match ? match[1] : String(strandVal);
          currentStrandName = match ? match[2].trim() : strandVal;
        }
        if (subStrandVal) {
          const match = subStrandVal.match(/^([\d.]+)\s+(.+)$/);
          currentSubStrandCode = match ? match[1] : String(subStrandVal);
          currentSubStrandName = match ? match[2].trim() : subStrandVal;
        }

        if (!currentStrandCode || !currentSubStrandCode || !rubricVal) continue;

        if (!strandsMap.has(currentStrandCode)) {
          strandsMap.set(currentStrandCode, {
            strand_code: currentStrandCode,
            strand_name: currentStrandName || currentStrandCode,
            sub_strands: new Map()
          });
        }
        const strand = strandsMap.get(currentStrandCode);
        if (!strand.sub_strands.has(currentSubStrandCode)) {
          strand.sub_strands.set(currentSubStrandCode, {
            sub_strand_code: currentSubStrandCode,
            sub_strand_name: currentSubStrandName || currentSubStrandCode,
            indicators: [],
            rubrics: []
          });
        }
        const subStrand = strand.sub_strands.get(currentSubStrandCode);
        if (!subStrand.rubrics.includes(rubricVal)) {
          subStrand.rubrics.push(rubricVal);
        }
      }

      // Build final strands; ensure each sub_strand has both rubrics and indicators (UI shows indicators)
      const strands = Array.from(strandsMap.values()).map(s => ({
        strand_code: s.strand_code,
        strand_name: s.strand_name,
        sub_strands: Array.from(s.sub_strands.values()).map(ss => {
          const rubrics = ss.rubrics || [];
          const indicators = (ss.indicators && ss.indicators.length) ? ss.indicators : rubrics.map((r, i) => ({
            indicator_code: `R${i + 1}`,
            indicator_name: typeof r === 'string' ? r : (r.indicator_name || r)
          }));
          return {
            sub_strand_code: ss.sub_strand_code,
            sub_strand_name: ss.sub_strand_name,
            indicators,
            rubrics
          };
        })
      }));

      if (strands.length === 0) {
        return res.status(400).json({
          message: 'No valid strands found. Ensure your Excel has columns: Strand, Sub-strand, Rubrics. Example: "1.0 Crop Production", "1.1 Agricultural Land", "Ability to..."'
        });
      }

      const strandsJson = JSON.stringify(strands);
      try {
        await pool.query(
          'UPDATE learning_areas SET strands = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [strandsJson, learningAreaId]
        );
      } catch (dbErr) {
        console.error('Import Excel DB update error:', dbErr.message, dbErr.code);
        if (dbErr.code === '42703' && dbErr.message && dbErr.message.includes('updated_at')) {
          await pool.query(
            'UPDATE learning_areas SET strands = $1::jsonb WHERE id = $2',
            [strandsJson, learningAreaId]
          );
        } else {
          throw dbErr;
        }
      }

      const totalSubstrands = strands.reduce((sum, s) => sum + (s.sub_strands?.length || 0), 0);
      const totalRubrics = strands.reduce((sum, s) => sum + (s.sub_strands || []).reduce((a, ss) => a + (ss.rubrics?.length || 0), 0), 0);
      res.status(200).json({
        message: 'Import successful',
        learningAreaName: laResult.rows[0]?.name,
        summary: { strands: strands.length, sub_strands: totalSubstrands, rubrics: totalRubrics }
      });
    } catch (error) {
      if (error.message && error.message.includes('Only Excel')) {
        return res.status(400).json({ message: error.message });
      }
      console.error('Import Excel error:', error.message, error.code || '');
      const isDb = error.code && String(error.code).match(/^[0-9A-Z]{5}$/);
      const message = isDb ? `Database error: ${error.message}` : (error.message || 'Failed to import Excel file');
      res.status(500).json({ message });
    }
  }
);

module.exports = router;

