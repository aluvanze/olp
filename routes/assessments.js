const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Enter formative assessment (rubric level 1-4)
router.post('/formative', authorize('teacher', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    const { learner_id, learning_area_id, strand_code, sub_strand_code, indicator_code, rubric_level, term, academic_year, notes } = req.body;
    
    // Validate rubric level
    if (rubric_level < 1 || rubric_level > 4) {
      return res.status(400).json({ message: 'Rubric level must be between 1 and 4' });
    }
    
    // Calculate score from rubric level
    // Level 1 = 25%, Level 2 = 50%, Level 3 = 75%, Level 4 = 100%
    const score = rubric_level * 25;
    
    // Verify teacher has access to this learning area
    if (req.user.role === 'teacher') {
      const courseCheck = await pool.query(
        'SELECT id FROM courses WHERE teacher_id = $1 AND learning_area_id = $2',
        [req.user.id, learning_area_id]
      );
      if (courseCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Access denied to this learning area' });
      }
    }
    
    const result = await pool.query(
      `INSERT INTO formative_assessments 
       (learner_id, learning_area_id, strand_code, sub_strand_code, indicator_code, rubric_level, score, term, academic_year, teacher_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [learner_id, learning_area_id, strand_code, sub_strand_code, indicator_code, rubric_level, score, term, academic_year, req.user.id, notes || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Enter formative assessment error:', error);
    res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// Bulk enter formative assessments
router.post('/formative/bulk', authorize('teacher', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    const { assessments } = req.body; // Array of assessment objects
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      
      for (const assessment of assessments) {
        const { learner_id, learning_area_id, strand_code, sub_strand_code, indicator_code, rubric_level, term, academic_year, notes } = assessment;
        
        if (rubric_level < 1 || rubric_level > 4) {
          continue; // Skip invalid entries
        }
        
        const score = rubric_level * 25;
        
        const result = await client.query(
          `INSERT INTO formative_assessments 
           (learner_id, learning_area_id, strand_code, sub_strand_code, indicator_code, rubric_level, score, term, academic_year, teacher_id, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [learner_id, learning_area_id, strand_code, sub_strand_code, indicator_code, rubric_level, score, term, academic_year, req.user.id, notes || null]
        );
        results.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      res.status(201).json({ message: 'Formative assessments entered successfully', assessments: results });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk enter formative assessments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create summative assessment (examination)
router.post('/summative', authorize('teacher', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    const { name, type, term, academic_year, school_id, learning_area_id, total_marks } = req.body;
    
    if (!['Opener', 'Mid', 'End'].includes(type)) {
      return res.status(400).json({ message: 'Type must be Opener, Mid, or End' });
    }
    
    const result = await pool.query(
      `INSERT INTO summative_assessments 
       (name, type, term, academic_year, school_id, learning_area_id, total_marks, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, type, term, academic_year, school_id || req.user.school_id, learning_area_id, total_marks || 100, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create summative assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enter summative results
router.post('/summative/:assessmentId/results', authorize('teacher', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { results } = req.body; // Array of {learner_id, score}
    
    // Get assessment details
    const assessmentResult = await pool.query(
      'SELECT total_marks FROM summative_assessments WHERE id = $1',
      [assessmentId]
    );
    
    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    const totalMarks = parseFloat(assessmentResult.rows[0].total_marks);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const savedResults = [];
      
      for (const result of results) {
        const { learner_id, score } = result;
        const percentage = (score / totalMarks) * 100;
        
        // Assign grade based on percentage (CBC scale)
        let grade = 'E';
        if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';
        
        const resultQuery = await client.query(
          `INSERT INTO summative_results 
           (assessment_id, learner_id, score, percentage, grade, entered_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (assessment_id, learner_id)
           DO UPDATE SET score = EXCLUDED.score, percentage = EXCLUDED.percentage, grade = EXCLUDED.grade
           RETURNING *`,
          [assessmentId, learner_id, score, percentage, grade, req.user.id]
        );
        savedResults.push(resultQuery.rows[0]);
      }
      
      await client.query('COMMIT');
      res.status(201).json({ message: 'Summative results entered successfully', results: savedResults });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Enter summative results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Synthesize result slips for a term (automatic at end of term)
router.post('/synthesize/:term/:academicYear', authorize('teacher', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    const { term, academicYear } = req.params;
    const { learner_ids } = req.body; // Optional: specific learners, or null for all
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const synthesized = [];
      
      // Get learners to process
      let learnersQuery = 'SELECT DISTINCT learner_id FROM formative_assessments WHERE term = $1 AND academic_year = $2';
      const queryParams = [term, academicYear];
      
      if (learner_ids && learner_ids.length > 0) {
        learnersQuery += ' AND learner_id = ANY($3)';
        queryParams.push(learner_ids);
      }
      
      const learnersResult = await client.query(learnersQuery, queryParams);
      
      for (const row of learnersResult.rows) {
        const learnerId = row.learner_id;
        
        // Get all learning areas for this learner
        const learningAreasResult = await client.query(
          'SELECT learning_area_id FROM learner_learning_areas WHERE learner_id = $1',
          [learnerId]
        );
        
        // Create or update result slip
        const resultSlipResult = await client.query(
          `INSERT INTO result_slips (learner_id, term, academic_year, synthesized_by)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (learner_id, term, academic_year)
           DO UPDATE SET synthesized_at = CURRENT_TIMESTAMP, synthesized_by = EXCLUDED.synthesized_by
           RETURNING id`,
          [learnerId, term, academicYear, req.user.id]
        );
        
        const resultSlipId = resultSlipResult.rows[0].id;
        
        // Process each learning area
        for (const laRow of learningAreasResult.rows) {
          const learningAreaId = laRow.learning_area_id;
          
          // Calculate average formative score
          const formativeAvgResult = await client.query(
            `SELECT AVG(score) as avg_score 
             FROM formative_assessments 
             WHERE learner_id = $1 AND learning_area_id = $2 AND term = $3 AND academic_year = $4`,
            [learnerId, learningAreaId, term, academicYear]
          );
          const averageFormativeScore = parseFloat(formativeAvgResult.rows[0]?.avg_score || 0);
          
          // Get summative score (End term exam)
          const summativeResult = await client.query(
            `SELECT sr.score, sr.percentage
             FROM summative_results sr
             INNER JOIN summative_assessments sa ON sr.assessment_id = sa.id
             WHERE sr.learner_id = $1 AND sa.learning_area_id = $2 AND sa.term = $3 AND sa.academic_year = $4 AND sa.type = 'End'`,
            [learnerId, learningAreaId, term, academicYear]
          );
          
          const summativeScore = summativeResult.rows.length > 0 ? parseFloat(summativeResult.rows[0].score) : null;
          const summativePercentage = summativeResult.rows.length > 0 ? parseFloat(summativeResult.rows[0].percentage) : null;
          
          // Calculate final score (60% formative + 40% summative)
          let finalScore = averageFormativeScore;
          let finalGrade = 'E';
          
          if (summativePercentage !== null) {
            finalScore = (averageFormativeScore * 0.6) + (summativePercentage * 0.4);
          }
          
          // Assign final grade
          if (finalScore >= 80) finalGrade = 'A';
          else if (finalScore >= 70) finalGrade = 'B';
          else if (finalScore >= 60) finalGrade = 'C';
          else if (finalScore >= 50) finalGrade = 'D';
          
          // Insert or update result slip detail
          await client.query(
            `INSERT INTO result_slip_details 
             (result_slip_id, learning_area_id, average_formative_score, summative_score, final_score, final_grade)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (result_slip_id, learning_area_id)
             DO UPDATE SET 
               average_formative_score = EXCLUDED.average_formative_score,
               summative_score = EXCLUDED.summative_score,
               final_score = EXCLUDED.final_score,
               final_grade = EXCLUDED.final_grade`,
            [resultSlipId, learningAreaId, averageFormativeScore, summativeScore, finalScore, finalGrade]
          );
        }
        
        synthesized.push(learnerId);
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Result slips synthesized successfully', learners_processed: synthesized.length });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Synthesize result slips error:', error);
    res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// Get result slip for a learner
router.get('/result-slip/:learnerId/:term/:academicYear', async (req, res) => {
  try {
    const { learnerId, term, academicYear } = req.params;
    
    // Verify access
    if (req.user.role === 'student') {
      const learnerCheck = await pool.query('SELECT user_id FROM learner_profiles WHERE id = $1', [learnerId]);
      if (learnerCheck.rows.length === 0 || learnerCheck.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'parent') {
      const learnerCheck = await pool.query('SELECT parent_id FROM learner_profiles WHERE id = $1', [learnerId]);
      if (learnerCheck.rows.length === 0 || learnerCheck.rows[0].parent_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Get result slip
    const resultSlipResult = await pool.query(
      `SELECT * FROM result_slips 
       WHERE learner_id = $1 AND term = $2 AND academic_year = $3`,
      [learnerId, term, academicYear]
    );
    
    if (resultSlipResult.rows.length === 0) {
      return res.status(404).json({ message: 'Result slip not found. It may not have been synthesized yet.' });
    }
    
    const resultSlip = resultSlipResult.rows[0];
    
    // Get result slip details with learning area names
    const detailsResult = await pool.query(
      `SELECT rsd.*, la.name as learning_area_name, la.code as learning_area_code
       FROM result_slip_details rsd
       INNER JOIN learning_areas la ON rsd.learning_area_id = la.id
       WHERE rsd.result_slip_id = $1
       ORDER BY la.is_core DESC, la.name`,
      [resultSlip.id]
    );
    
    resultSlip.details = detailsResult.rows;
    
    // Get learner info
    const learnerResult = await pool.query(
      `SELECT lp.*, u.first_name, u.last_name, u.email, s.name as school_name
       FROM learner_profiles lp
       INNER JOIN users u ON lp.user_id = u.id
       LEFT JOIN schools s ON lp.school_id = s.id
       WHERE lp.id = $1`,
      [learnerId]
    );
    
    resultSlip.learner = learnerResult.rows[0];
    
    res.json(resultSlip);
  } catch (error) {
    console.error('Get result slip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all result slips for a learner
router.get('/result-slips/:learnerId', async (req, res) => {
  try {
    const { learnerId } = req.params;
    
    // Verify access (same as above)
    if (req.user.role === 'student') {
      const learnerCheck = await pool.query('SELECT user_id FROM learner_profiles WHERE id = $1', [learnerId]);
      if (learnerCheck.rows.length === 0 || learnerCheck.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const result = await pool.query(
      `SELECT * FROM result_slips 
       WHERE learner_id = $1 
       ORDER BY academic_year DESC, term DESC`,
      [learnerId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get result slips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

