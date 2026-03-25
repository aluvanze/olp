const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Get system overview/dashboard (Headteacher and Superadmin)
router.get('/dashboard', authorize('headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    // Get statistics
    const stats = {};
    
    // User counts
    const userStats = await pool.query(
      `SELECT role, COUNT(*) as count 
       FROM users 
       WHERE is_active = true 
       GROUP BY role`
    );
    stats.users = userStats.rows.reduce((acc, row) => {
      acc[row.role] = parseInt(row.count);
      return acc;
    }, {});
    
    // Course statistics
    const courseStats = await pool.query(
      `SELECT 
         COUNT(*) as total_courses,
         COUNT(DISTINCT teacher_id) as teachers_with_courses,
         COUNT(DISTINCT ce.student_id) as enrolled_students
       FROM courses c
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'active'
       WHERE c.is_active = true`
    );
    stats.courses = courseStats.rows[0];
    
    // Assignment statistics
    const assignmentStats = await pool.query(
      `SELECT 
         COUNT(*) as total_assignments,
         COUNT(DISTINCT course_id) as courses_with_assignments,
         COUNT(DISTINCT asub.student_id) as students_with_submissions
       FROM assignments a
       LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id`
    );
    stats.assignments = assignmentStats.rows[0];
    
    // Grade statistics
    const gradeStats = await pool.query(
      `SELECT 
         COUNT(*) as total_grades,
         COUNT(DISTINCT student_id) as students_graded,
         COUNT(DISTINCT course_id) as courses_graded,
         AVG(percentage) as average_percentage
       FROM grades`
    );
    stats.grades = gradeStats.rows[0];
    
    // Attendance statistics
    const attendanceStats = await pool.query(
      `SELECT 
         COUNT(*) as total_records,
         COUNT(*) FILTER (WHERE status = 'present') as present_count,
         COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
         COUNT(DISTINCT student_id) as students_tracked,
         COUNT(DISTINCT course_id) as courses_tracked
       FROM attendance`
    );
    stats.attendance = attendanceStats.rows[0];
    
    res.json(stats);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// School profile + configured pathways
router.get('/school-profile', authorize('headteacher', 'superadmin', 'deputy_headteacher'), async (_req, res) => {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS school_pathways (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        pathway_id INTEGER REFERENCES pathways(id) ON DELETE CASCADE,
        UNIQUE(school_id, pathway_id)
      )`
    );

    const schoolResult = await pool.query('SELECT * FROM schools ORDER BY id ASC LIMIT 1');
    const pathwaysResult = await pool.query('SELECT id, name, code, description, is_active FROM pathways WHERE is_active = true ORDER BY name');
    let selectedPathwayIds = [];
    if (schoolResult.rows.length > 0) {
      const selected = await pool.query('SELECT pathway_id FROM school_pathways WHERE school_id = $1', [schoolResult.rows[0].id]);
      selectedPathwayIds = selected.rows.map(r => r.pathway_id);
    }

    res.json({
      school: schoolResult.rows[0] || null,
      pathways: pathwaysResult.rows,
      selected_pathway_ids: selectedPathwayIds
    });
  } catch (error) {
    console.error('Get school profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/school-profile', authorize('headteacher', 'superadmin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `CREATE TABLE IF NOT EXISTS school_pathways (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        pathway_id INTEGER REFERENCES pathways(id) ON DELETE CASCADE,
        UNIQUE(school_id, pathway_id)
      )`
    );

    const { id, name, code, county, sub_county, address, logo_url, pathway_ids } = req.body;
    if (!name || !code) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'School name and code are required' });
    }

    let school;
    if (id) {
      const updated = await client.query(
        `UPDATE schools
         SET name = $1, code = $2, county = $3, sub_county = $4, address = $5, logo_url = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [name, code, county || null, sub_county || null, address || null, logo_url || null, id]
      );
      school = updated.rows[0];
    } else {
      const inserted = await client.query(
        `INSERT INTO schools (name, code, county, sub_county, address, logo_url, headteacher_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, code, county || null, sub_county || null, address || null, logo_url || null, req.user.id]
      );
      school = inserted.rows[0];
    }

    await client.query('DELETE FROM school_pathways WHERE school_id = $1', [school.id]);
    const selected = Array.isArray(pathway_ids) ? pathway_ids : [];
    for (const pathwayId of selected) {
      await client.query(
        'INSERT INTO school_pathways (school_id, pathway_id) VALUES ($1, $2) ON CONFLICT (school_id, pathway_id) DO NOTHING',
        [school.id, pathwayId]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'School profile saved', school, selected_pathway_ids: selected });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Save school profile error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// Curriculum coverage by learning area using latest formative rubric updates
router.get('/curriculum/progress', authorize('headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    const laResult = await pool.query('SELECT id, name, code, strands FROM learning_areas ORDER BY name');

    const progress = [];
    for (const la of laResult.rows) {
      let strands = la.strands;
      if (typeof strands === 'string') {
        try { strands = JSON.parse(strands); } catch (_) { strands = []; }
      }
      if (!Array.isArray(strands)) strands = [];

      const totalSubStrands = strands.reduce((sum, s) => {
        const sub = Array.isArray(s?.sub_strands) ? s.sub_strands : [];
        return sum + sub.length;
      }, 0);

      let coverageQuery = `SELECT COUNT(DISTINCT sub_strand_code) AS covered,
                                  MAX(rubric_level) AS last_updated_rubric_level,
                                  MAX(created_at) AS last_updated_at
                           FROM formative_assessments
                           WHERE learning_area_id = $1`;
      const params = [la.id];
      let p = 2;
      if (term) { coverageQuery += ` AND term = $${p++}`; params.push(term); }
      if (academic_year) { coverageQuery += ` AND academic_year = $${p++}`; params.push(academic_year); }

      const cov = await pool.query(coverageQuery, params);
      const covered = parseInt(cov.rows[0]?.covered || 0, 10);
      const pct = totalSubStrands > 0 ? Math.round((covered / totalSubStrands) * 10000) / 100 : 0;

      progress.push({
        learning_area_id: la.id,
        learning_area_name: la.name,
        learning_area_code: la.code,
        total_sub_strands: totalSubStrands,
        covered_sub_strands: covered,
        progress_percentage: pct,
        last_updated_rubric_level: cov.rows[0]?.last_updated_rubric_level || null,
        last_updated_at: cov.rows[0]?.last_updated_at || null
      });
    }

    res.json(progress);
  } catch (error) {
    console.error('Get curriculum progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Performance analytics (school-wide and by learning area)
router.get('/performance-analytics', authorize('headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const { term, academic_year } = req.query;

    let whereF = 'WHERE 1=1';
    let whereS = 'WHERE 1=1';
    const fParams = [];
    const sParams = [];
    let fp = 1;
    let sp = 1;
    if (term) {
      whereF += ` AND fa.term = $${fp++}`;
      whereS += ` AND sa.term = $${sp++}`;
      fParams.push(term);
      sParams.push(term);
    }
    if (academic_year) {
      whereF += ` AND fa.academic_year = $${fp++}`;
      whereS += ` AND sa.academic_year = $${sp++}`;
      fParams.push(academic_year);
      sParams.push(academic_year);
    }

    const overallFormative = await pool.query(
      `SELECT AVG(fa.score) AS avg_formative_score,
              COUNT(DISTINCT fa.learner_id) AS learners_with_formative
       FROM formative_assessments fa
       ${whereF}`,
      fParams
    );

    const overallSummative = await pool.query(
      `SELECT AVG(sr.percentage) AS avg_summative_percentage,
              COUNT(DISTINCT sr.learner_id) AS learners_with_summative
       FROM summative_results sr
       INNER JOIN summative_assessments sa ON sa.id = sr.assessment_id
       ${whereS}`,
      sParams
    );

    const byLearningArea = await pool.query(
      `SELECT la.id AS learning_area_id, la.name AS learning_area_name, la.code AS learning_area_code,
              AVG(fa.score) AS avg_formative_score,
              AVG(sr.percentage) AS avg_summative_percentage,
              COUNT(DISTINCT fa.learner_id) AS formative_learners,
              COUNT(DISTINCT sr.learner_id) AS summative_learners
       FROM learning_areas la
       LEFT JOIN formative_assessments fa ON fa.learning_area_id = la.id
         ${term ? 'AND fa.term = $1' : ''} ${academic_year ? `AND fa.academic_year = $${term ? 2 : 1}` : ''}
       LEFT JOIN summative_assessments sa ON sa.learning_area_id = la.id
         ${term ? 'AND sa.term = $1' : ''} ${academic_year ? `AND sa.academic_year = $${term ? 2 : 1}` : ''}
       LEFT JOIN summative_results sr ON sr.assessment_id = sa.id
       GROUP BY la.id, la.name, la.code
       ORDER BY la.name`,
      [...(term ? [term] : []), ...(academic_year ? [academic_year] : [])]
    );

    res.json({
      overall: {
        avg_formative_score: parseFloat(overallFormative.rows[0]?.avg_formative_score || 0),
        learners_with_formative: parseInt(overallFormative.rows[0]?.learners_with_formative || 0, 10),
        avg_summative_percentage: parseFloat(overallSummative.rows[0]?.avg_summative_percentage || 0),
        learners_with_summative: parseInt(overallSummative.rows[0]?.learners_with_summative || 0, 10)
      },
      by_learning_area: byLearningArea.rows
    });
  } catch (error) {
    console.error('Get performance analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send/re-send activation link to teacher
router.post('/teachers/:id/send-activation', authorize('headteacher', 'superadmin'), async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id, 10);
    if (Number.isNaN(teacherId)) return res.status(400).json({ message: 'Invalid teacher ID' });

    const teacherResult = await pool.query(
      `SELECT id, email, first_name, last_name
       FROM users
       WHERE id = $1 AND role = 'teacher'`,
      [teacherId]
    );
    if (teacherResult.rows.length === 0) return res.status(404).json({ message: 'Teacher not found' });
    const teacher = teacherResult.rows[0];

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3); // 72h
    await pool.query(
      `UPDATE users
       SET verification_token = $1, verification_token_expires = $2
       WHERE id = $3`,
      [token, expiresAt, teacherId]
    );

    const baseUrl = process.env.FRONTEND_URL || req.protocol + '://' + req.get('host');
    const activationLink = `${baseUrl}/?activate_token=${encodeURIComponent(token)}`;

    let emailSent = false;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && teacher.email) {
      try {
        await emailTransporter.sendMail({
          from: `"${process.env.EMAIL_FROM || 'Senior School OLP'}" <${process.env.EMAIL_USER}>`,
          to: teacher.email,
          subject: 'Activate your teacher account',
          html: `<p>Hello ${teacher.first_name || 'Teacher'},</p>
                 <p>Your teacher account is ready. Use the link below to activate and set your password:</p>
                 <p><a href="${activationLink}">${activationLink}</a></p>
                 <p>This link expires in 72 hours.</p>`
        });
        emailSent = true;
      } catch (emailError) {
        console.error('Send activation email error:', emailError);
      }
    }

    res.json({ message: emailSent ? 'Activation link sent' : 'Activation link generated', activation_link: activationLink, email_sent: emailSent });
  } catch (error) {
    console.error('Send activation link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Teacher verification queue (verified/unverified + activation status)
router.get('/teachers/verification-queue', authorize('headteacher', 'superadmin', 'deputy_headteacher'), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, id_number, tsc_number,
              is_active, is_verified, verification_token_expires, created_at
       FROM users
       WHERE role = 'teacher'
       ORDER BY is_verified ASC, created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get teacher verification queue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manual verification toggle for teacher
router.put('/teachers/:id/verification', authorize('headteacher', 'superadmin'), async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id, 10);
    const verify = req.body.verify === true;
    if (Number.isNaN(teacherId)) return res.status(400).json({ message: 'Invalid teacher ID' });

    const result = await pool.query(
      `UPDATE users
       SET is_verified = $1,
           is_active = CASE WHEN $1 = true THEN true ELSE is_active END,
           verification_token = CASE WHEN $1 = true THEN NULL ELSE verification_token END,
           verification_token_expires = CASE WHEN $1 = true THEN NULL ELSE verification_token_expires END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND role = 'teacher'
       RETURNING id, first_name, last_name, email, is_verified, is_active`,
      [verify, teacherId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ message: verify ? 'Teacher marked as verified' : 'Teacher marked as unverified', teacher: result.rows[0] });
  } catch (error) {
    console.error('Manual teacher verification update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all teachers with their classes (Headteacher/Superadmin)
router.get('/teachers/overview', authorize('headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         u.id, u.username, u.email, u.first_name, u.last_name, u.phone,
         COUNT(DISTINCT c.id) as total_courses,
         COUNT(DISTINCT ce.student_id) as total_students,
         COUNT(DISTINCT a.id) as total_assignments,
         COUNT(DISTINCT g.id) as total_grades_given,
         COUNT(DISTINCT att.id) as attendance_records
       FROM users u
       LEFT JOIN courses c ON u.id = c.teacher_id AND c.is_active = true
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'active'
       LEFT JOIN assignments a ON c.id = a.course_id
       LEFT JOIN grades g ON c.id = g.course_id AND g.graded_by = u.id
       LEFT JOIN attendance att ON c.id = att.course_id AND att.marked_by = u.id
       WHERE u.role = 'teacher' AND u.is_active = true
       GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.phone
       ORDER BY u.last_name, u.first_name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get teachers overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teacher's detailed class data
router.get('/teachers/:teacherId/classes', authorize('headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const courses = await pool.query(
      `SELECT 
         c.*,
         COUNT(DISTINCT ce.student_id) as enrolled_students,
         COUNT(DISTINCT a.id) as assignment_count,
         COUNT(DISTINCT lm.id) as module_count
       FROM courses c
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'active'
       LEFT JOIN assignments a ON c.id = a.course_id
       LEFT JOIN learning_modules lm ON c.id = lm.course_id
       WHERE c.teacher_id = $1 AND c.is_active = true
       GROUP BY c.id
       ORDER BY c.course_name`,
      [teacherId]
    );
    
    // Get detailed stats for each course
    const coursesWithStats = await Promise.all(
      courses.rows.map(async (course) => {
        // Average grade for this course
        const avgGrade = await pool.query(
          `SELECT AVG(percentage) as avg_percentage 
           FROM grades 
           WHERE course_id = $1`,
          [course.id]
        );
        
        // Attendance stats
        const attendanceStats = await pool.query(
          `SELECT 
             COUNT(*) as total_days,
             COUNT(*) FILTER (WHERE status = 'present') as present_days,
             ROUND(COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0), 2) as attendance_rate
           FROM attendance 
           WHERE course_id = $1`,
          [course.id]
        );
        
        return {
          ...course,
          average_grade: avgGrade.rows[0]?.avg_percentage || 0,
          attendance: attendanceStats.rows[0] || {}
        };
      })
    );
    
    res.json(coursesWithStats);
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new teacher (Headteacher/Superadmin)
router.post('/teachers', authorize('headteacher', 'superadmin'), async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, phone, id_number, tsc_number } = req.body;
    
    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({ message: 'Username, email, password, first_name, and last_name are required' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create teacher
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone, id_number, tsc_number, is_verified)
       VALUES ($1, $2, $3, $4, $5, 'teacher', $6, $7, $8, false)
       RETURNING id, username, email, first_name, last_name, role, phone, id_number, tsc_number, is_verified, created_at`,
      [username, email, passwordHash, first_name, last_name, phone || null, id_number || null, tsc_number || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Allocate course to teacher (Headteacher/Superadmin)
// This endpoint supports both simple assignment and term-specific assignment
router.post('/allocate-course', authorize('headteacher', 'superadmin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { teacher_id, course_id, term_number, academic_year, notes } = req.body;
    
    if (!teacher_id || !course_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Teacher ID and Course ID are required' });
    }
    
    // Verify teacher exists and is a teacher
    const teacherCheck = await client.query(
      'SELECT id, role FROM users WHERE id = $1 AND role = $2',
      [teacher_id, 'teacher']
    );
    
    if (teacherCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Get course details before update
    const courseCheck = await client.query(
      'SELECT id, course_name, course_code, grade_id, academic_year, learning_area_id, is_active FROM courses WHERE id = $1',
      [course_id]
    );
    
    if (courseCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const course = courseCheck.rows[0];
    
    // Update course teacher (for backward compatibility)
    const courseResult = await client.query(
      `UPDATE courses 
       SET teacher_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [teacher_id, course_id]
    );
    
    // If term_number and academic_year are provided, create term-specific assignment
    if (term_number && academic_year) {
      // Validate term number
      if (term_number < 1 || term_number > 3) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Term number must be between 1 and 3' });
      }
      
      // Create or update teacher_course_assignments record
      await client.query(
        `INSERT INTO teacher_course_assignments 
         (course_id, teacher_id, term_number, academic_year, assigned_by, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (course_id, teacher_id, term_number, academic_year) 
         DO UPDATE SET is_active = true, assigned_by = EXCLUDED.assigned_by, assigned_at = CURRENT_TIMESTAMP`,
        [course_id, teacher_id, term_number, academic_year, req.user.id]
      );
    }
    
    // Record allocation in teacher_allocations table (for tracking)
    await client.query(
      `INSERT INTO teacher_allocations (teacher_id, course_id, allocated_by, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (teacher_id, course_id) 
       DO UPDATE SET allocated_by = EXCLUDED.allocated_by, notes = EXCLUDED.notes`,
      [teacher_id, course_id, req.user.id, notes || null]
    );
    
    await client.query('COMMIT');
    
    // Get grade info if available
    let gradeInfo = null;
    if (course.grade_id) {
      const gradeResult = await pool.query(
        'SELECT id, grade_number, name FROM grade_levels WHERE id = $1',
        [course.grade_id]
      );
      if (gradeResult.rows.length > 0) {
        gradeInfo = gradeResult.rows[0];
      }
    }
    
    // Get learning area info if available
    let learningAreaInfo = null;
    if (course.learning_area_id) {
      const laResult = await pool.query(
        'SELECT id, name, code FROM learning_areas WHERE id = $1',
        [course.learning_area_id]
      );
      if (laResult.rows.length > 0) {
        learningAreaInfo = laResult.rows[0];
      }
    }
    
    res.json({ 
      message: term_number && academic_year 
        ? `Course allocated successfully for Term ${term_number} ${academic_year}`
        : 'Course allocated successfully',
      course: courseResult.rows[0],
      term_assignment: term_number && academic_year ? { term_number, academic_year } : null,
      learning_area: learningAreaInfo,
      grade: gradeInfo,
      note: !course.learning_area_id 
        ? 'Warning: Course is not linked to a learning area. Please link it to a learning area for full functionality.'
        : null
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Allocate course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
});

// Get all pending enrollments (for teachers to authorize)
router.get('/enrollments/pending', authorize('teacher', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    let query = `
      SELECT ce.*, 
             u.first_name, u.last_name, u.email, u.username,
             c.course_name, c.course_code,
             t.first_name as teacher_first_name, t.last_name as teacher_last_name
      FROM course_enrollments ce
      INNER JOIN users u ON ce.student_id = u.id
      INNER JOIN courses c ON ce.course_id = c.id
      LEFT JOIN users t ON c.teacher_id = t.id
      WHERE ce.authorization_status = 'pending'
    `;
    
    const params = [];
    
    // Teachers can only see enrollments for their courses
    if (req.user.role === 'teacher') {
      query += ' AND c.teacher_id = $1';
      params.push(req.user.id);
    }
    
    query += ' ORDER BY ce.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending enrollments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Authorize/reject student enrollment (Teacher/Headteacher/Superadmin)
router.post('/enrollments/:enrollmentId/authorize', authorize('teacher', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status, notes } = req.body; // status: 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    
    // Get enrollment with course info
    const enrollmentCheck = await pool.query(
      `SELECT ce.*, c.teacher_id 
       FROM course_enrollments ce
       INNER JOIN courses c ON ce.course_id = c.id
       WHERE ce.id = $1`,
      [enrollmentId]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    const enrollment = enrollmentCheck.rows[0];
    
    // Teachers can only authorize enrollments for their courses
    if (req.user.role === 'teacher' && enrollment.teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update enrollment
    const result = await pool.query(
      `UPDATE course_enrollments 
       SET authorization_status = $1,
           authorized_by = $2,
           authorization_date = CURRENT_TIMESTAMP,
           authorization_notes = $3,
           status = CASE WHEN $1 = 'approved' THEN 'active' ELSE 'inactive' END
       WHERE id = $4
       RETURNING *`,
      [status, req.user.id, notes || null, enrollmentId]
    );
    
    res.json({ message: `Enrollment ${status}`, enrollment: result.rows[0] });
  } catch (error) {
    console.error('Authorize enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Superadmin/Headteacher: Create new user
router.post('/users', authorize('superadmin', 'headteacher'), async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, role, phone } = req.body;

    const validRoles = ['student', 'teacher', 'headteacher', 'deputy_headteacher', 'finance', 'parent', 'superadmin'];
    if (!username || !email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ message: 'Username, email, password, first_name, last_name, and role are required' });
    }
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be: ' + validRoles.join(', ') });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username.trim(), email.trim()]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, first_name, last_name, role, phone, is_active, created_at`,
      [username.trim(), email.trim(), passwordHash, first_name.trim(), last_name.trim(), role, phone ? phone.trim() : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Superadmin/Headteacher: Get all users with pagination
router.get('/users', authorize('superadmin', 'headteacher'), async (req, res) => {
  try {
    const { role, search, is_active, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (role) {
      whereClause += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }
    
    if (search) {
      whereClause += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR username ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (is_active !== undefined) {
      whereClause += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);
    
    // Get paginated users
    let query = `
      SELECT id, username, email, first_name, last_name, role, phone, is_active, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limitNum, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      users: result.rows,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_items: total,
        items_per_page: limitNum,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Superadmin: Update user (activate/deactivate, change role)
router.put('/users/:id', authorize('superadmin', 'headteacher'), async (req, res) => {
  try {
    const { is_active, role } = req.body;
    const userId = req.params.id;
    
    // Prevent changing own role or deactivating self
    if (userId == req.user.id) {
      return res.status(400).json({ message: 'Cannot modify your own account' });
    }
    
    let updateFields = [];
    const params = [];
    let paramCount = 1;
    
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      params.push(is_active);
      paramCount++;
    }
    
    if (role) {
      updateFields.push(`role = $${paramCount}`);
      params.push(role);
      paramCount++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(userId);
    
    const result = await pool.query(
      `UPDATE users 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, username, email, first_name, last_name, role, is_active`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

