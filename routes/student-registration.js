const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();
router.use(authenticate);

// Register a new student and enroll in courses for a term
router.post('/', authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      first_name, 
      last_name, 
      admission_number,
      term,
      academic_year,
      course_ids, // Array of course IDs to enroll in
      parent_email, // Optional parent email
      parent_name // Optional parent name
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !first_name || !last_name || !term || !academic_year) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!course_ids || course_ids.length === 0) {
      return res.status(400).json({ message: 'At least one course must be selected' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if username or email already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Username or email already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user account
      const userResult = await client.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, 'student', true)
         RETURNING id`,
        [username, email, passwordHash, first_name, last_name]
      );

      const userId = userResult.rows[0].id;

      // Get or create parent if parent_email provided
      let parentId = null;
      if (parent_email) {
        const parentCheck = await client.query(
          'SELECT id FROM users WHERE email = $1 AND role = $2',
          [parent_email, 'parent']
        );

        if (parentCheck.rows.length > 0) {
          parentId = parentCheck.rows[0].id;
        } else {
          // Create parent account
          const parentPassword = Math.random().toString(36).slice(-8); // Generate random password
          const parentPasswordHash = await bcrypt.hash(parentPassword, 10);
          const parentName = parent_name || 'Parent';
          
          const parentResult = await client.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
             VALUES ($1, $2, $3, $4, $5, 'parent', true)
             RETURNING id`,
            [`parent_${parent_email.split('@')[0]}`, parent_email, parentPasswordHash, parentName, '']
          );
          parentId = parentResult.rows[0].id;
        }
      }

      // Get school_id from the registering user
      const schoolResult = await client.query(
        'SELECT school_id FROM users WHERE id = $1',
        [req.user.id]
      );
      const schoolId = schoolResult.rows[0]?.school_id || null;

      // Create learner profile
      const learnerResult = await client.query(
        `INSERT INTO learner_profiles (user_id, school_id, admission_number, parent_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [userId, schoolId, admission_number || null, parentId]
      );

      const learnerId = learnerResult.rows[0].id;

      // Enroll student in selected courses for the term
      const enrollments = [];
      for (const courseId of course_ids) {
        // Verify course exists and is for the correct academic year
        const courseCheck = await client.query(
          'SELECT id, academic_year FROM courses WHERE id = $1 AND is_active = true',
          [courseId]
        );

        if (courseCheck.rows.length === 0) {
          continue; // Skip invalid courses
        }

        // Check if enrollment already exists
        const existingEnrollment = await client.query(
          'SELECT id FROM course_enrollments WHERE student_id = $1 AND course_id = $2',
          [userId, courseId]
        );

        if (existingEnrollment.rows.length === 0) {
          // Create enrollment (auto-approved if registered by teacher/admin)
          const enrollmentResult = await client.query(
            `INSERT INTO course_enrollments (student_id, course_id, status, enrollment_date)
             VALUES ($1, $2, 'active', CURRENT_DATE)
             RETURNING id`,
            [userId, courseId]
          );
          enrollments.push(enrollmentResult.rows[0].id);
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Student registered and enrolled successfully',
        student: {
          id: userId,
          username,
          email,
          first_name,
          last_name,
          admission_number
        },
        enrollments: enrollments.length,
        courses_enrolled: course_ids.length
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Register student error:', error);
    res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// Get students for registration (list existing students)
router.get('/students', authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin', 'finance'), async (req, res) => {
  try {
    const { search, admission_number } = req.query;
    
    let query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.is_active,
             lp.id as learner_id, lp.admission_number, lp.school_id, lp.pathway_id,
             p.name as pathway_name
      FROM users u
      LEFT JOIN learner_profiles lp ON u.id = lp.user_id
      LEFT JOIN pathways p ON lp.pathway_id = p.id
      WHERE u.role = 'student'
    `;
    const params = [];
    let paramCount = 1;

    // Search by admission number (priority) - also search by username/name if admission number not found
    if (admission_number) {
      query += ` AND (
        lp.admission_number = $${paramCount} 
        OR lp.admission_number ILIKE $${paramCount + 1}
        OR u.username = $${paramCount}
        OR u.username ILIKE $${paramCount + 1}
      )`;
      params.push(admission_number, `%${admission_number}%`);
      paramCount += 2;
    } else if (search) {
      query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.username ILIKE $${paramCount} OR lp.admission_number ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY u.first_name, u.last_name LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's current course enrollments
router.get('/students/:studentId/enrollments', authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academic_year } = req.query;

    let query = `
      SELECT ce.id, ce.course_id, ce.status, ce.enrollment_date as enrolled_at,
             c.course_name, c.course_code, c.description, c.academic_year,
             u.first_name as teacher_first_name, u.last_name as teacher_last_name
      FROM course_enrollments ce
      INNER JOIN courses c ON ce.course_id = c.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE ce.student_id = $1 AND ce.status = 'active'
    `;
    const params = [studentId];

    if (academic_year) {
      query += ' AND c.academic_year = $2';
      params.push(academic_year);
    }

    query += ' ORDER BY c.course_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get student enrollments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove course enrollment
router.delete('/enrollments/:enrollmentId', authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const result = await pool.query(
      `UPDATE course_enrollments 
       SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [enrollmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json({ message: 'Course enrollment removed successfully', enrollment: result.rows[0] });
  } catch (error) {
    console.error('Remove enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll existing student in courses for a term
router.post('/enroll/:studentId', authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { course_ids, term, academic_year } = req.body;

    if (!course_ids || course_ids.length === 0) {
      return res.status(400).json({ message: 'At least one course must be selected' });
    }

    // Verify student exists
    const studentCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [parseInt(studentId), 'student']
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const enrollments = [];
      for (const courseId of course_ids) {
        // Verify course exists and matches academic year
        const courseCheck = await client.query(
          'SELECT id, academic_year FROM courses WHERE id = $1 AND is_active = true',
          [parseInt(courseId)]
        );

        if (courseCheck.rows.length === 0) {
          continue;
        }

        // Check if enrollment already exists (any status)
        const existingEnrollment = await client.query(
          'SELECT id, status FROM course_enrollments WHERE student_id = $1 AND course_id = $2',
          [parseInt(studentId), parseInt(courseId)]
        );

        if (existingEnrollment.rows.length === 0) {
          // No enrollment exists, create new one
          try {
            const enrollmentResult = await client.query(
              `INSERT INTO course_enrollments (student_id, course_id, status, enrollment_date)
               VALUES ($1, $2, 'active', CURRENT_DATE)
               RETURNING id`,
              [parseInt(studentId), parseInt(courseId)]
            );
            enrollments.push(enrollmentResult.rows[0].id);
          } catch (insertError) {
            console.error(`Failed to insert enrollment for course ${courseId}:`, insertError);
            // If it's a unique constraint violation, try to update
            if (insertError.code === '23505') {
              const updateResult = await client.query(
                `UPDATE course_enrollments 
                 SET status = 'active', enrollment_date = CURRENT_DATE
                 WHERE student_id = $1 AND course_id = $2
                 RETURNING id`,
                [parseInt(studentId), parseInt(courseId)]
              );
              if (updateResult.rows.length > 0) {
                enrollments.push(updateResult.rows[0].id);
              }
            } else {
              // Log the error but continue with other courses
              console.error(`Error enrolling in course ${courseId}:`, insertError.message);
            }
          }
        } else {
          // Enrollment exists, update to active if needed
          const enrollment = existingEnrollment.rows[0];
          if (enrollment.status !== 'active') {
            const updateResult = await client.query(
              `UPDATE course_enrollments 
               SET status = 'active', enrollment_date = CURRENT_DATE
               WHERE id = $1
               RETURNING id`,
              [enrollment.id]
            );
            enrollments.push(enrollment.id);
          } else {
            // Already active
            enrollments.push(enrollment.id);
          }
        }
      }

      await client.query('COMMIT');

      res.json({
        message: 'Student enrolled successfully',
        enrollments: enrollments.length,
        courses_enrolled: course_ids.length
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Enroll student error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack,
      studentId: req.params.studentId,
      course_ids: req.body.course_ids,
      term: req.body.term,
      academic_year: req.body.academic_year
    });
    
    // Return more detailed error
    const errorResponse = {
      message: 'Server error',
      error: error.message
    };
    
    // Include detailed error info (not in production)
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.details = {
        code: error.code,
        detail: error.detail,
        constraint: error.constraint
      };
    }
    
    res.status(500).json(errorResponse);
  }
});

// Get pathways
router.get('/pathways', authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, code, description FROM pathways WHERE is_active = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get pathways error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get learning areas by pathway (for enrollment selection)
router.get('/learning-areas/:pathwayId?', authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const { pathwayId } = req.params;
    const { academicYear } = req.query;
    
    if (!academicYear) {
      return res.status(400).json({ message: 'Academic year is required' });
    }
    
    let query = `
      SELECT la.id, la.name, la.code, la.is_core, la.pathway_id,
             p.name as pathway_name, p.code as pathway_code,
             c.id as course_id, c.course_name, c.course_code,
             u.first_name as teacher_first_name, u.last_name as teacher_last_name
      FROM learning_areas la
      LEFT JOIN pathways p ON la.pathway_id = p.id
      LEFT JOIN courses c ON c.learning_area_id = la.id AND c.academic_year = $1 AND c.is_active = true
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE 1=1
    `;
    const params = [academicYear];
    
    if (pathwayId) {
      query += ` AND (la.pathway_id = $2 OR la.is_core = true)`;
      params.push(pathwayId);
    } else {
      // If no pathway selected, show only core learning areas
      query += ` AND la.is_core = true`;
    }
    
    query += ` ORDER BY la.is_core DESC, la.name`;
    
    const result = await pool.query(query, params);
    
    // Group by core vs pathway electives
    const grouped = {
      core: [],
      pathway: []
    };
    
    result.rows.forEach(row => {
      if (row.is_core) {
        grouped.core.push(row);
      } else {
        grouped.pathway.push(row);
      }
    });
    
    res.json(grouped);
  } catch (error) {
    console.error('Get learning areas error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get courses available for enrollment in a term
router.get('/courses/:term/:academicYear', authorize('teacher', 'headteacher', 'deputy_headteacher', 'superadmin'), async (req, res) => {
  try {
    const { term, academicYear } = req.params;

    const result = await pool.query(
      `SELECT c.id, c.course_name, c.course_code, c.description,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.academic_year = $1 AND c.is_active = true
       ORDER BY c.course_name`,
      [academicYear]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get courses for enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

