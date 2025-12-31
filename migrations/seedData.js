const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
require('dotenv').config();

async function seedData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Seeding initial data...');
    
    // Hash password for default users
    const defaultPassword = await bcrypt.hash('password123', 10);
    
    // Create default admin/headteacher
    const headteacherResult = await client.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['headteacher', 'headteacher@school.com', defaultPassword, 'John', 'Principal', 'headteacher', '555-0101']
    );
    const headteacherId = headteacherResult.rows[0].id;
    
    // Create default deputy headteacher
    const deputyResult = await client.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['deputy', 'deputy@school.com', defaultPassword, 'Jane', 'Vice-Principal', 'deputy_headteacher', '555-0102']
    );
    const deputyId = deputyResult.rows[0].id;
    
    // Create default finance personnel
    const financeResult = await client.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['finance', 'finance@school.com', defaultPassword, 'Mike', 'Accountant', 'finance', '555-0103']
    );
    
    // Create default teacher
    const teacherResult = await client.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['teacher1', 'teacher1@school.com', defaultPassword, 'Sarah', 'Educator', 'teacher', '555-0104']
    );
    const teacherId = teacherResult.rows[0].id;
    
    // Create default student
    const studentResult = await client.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      ['student1', 'student1@school.com', defaultPassword, 'Alex', 'Student', 'student', '555-0105', '2008-01-15']
    );
    const studentId = studentResult.rows[0].id;
    
    // Create default parent
    const parentResult = await client.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['parent1', 'parent1@email.com', defaultPassword, 'Robert', 'Parent', 'parent', '555-0106']
    );
    const parentId = parentResult.rows[0].id;
    
    // Link parent to student
    await client.query(
      `INSERT INTO parent_student_relationships (parent_id, student_id)
       VALUES ($1, $2)`,
      [parentId, studentId]
    );
    
    // Create a sample course
    const courseResult = await client.query(
      `INSERT INTO courses (course_code, course_name, description, teacher_id, academic_year)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['MATH10', 'Mathematics Grade 10', 'Core mathematics for grade 10 students', teacherId, '2024-2025']
    );
    const courseId = courseResult.rows[0].id;
    
    // Enroll student in course
    await client.query(
      `INSERT INTO course_enrollments (student_id, course_id)
       VALUES ($1, $2)`,
      [studentId, courseId]
    );
    
    // Create a sample learning module
    const moduleResult = await client.query(
      `INSERT INTO learning_modules (course_id, module_name, module_description, module_order, is_published, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [courseId, 'Introduction to Algebra', 'Basic algebraic concepts and operations', 1, true, teacherId]
    );
    const moduleId = moduleResult.rows[0].id;
    
    // Add sample module content
    await client.query(
      `INSERT INTO module_content (module_id, content_type, title, content_text, display_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [moduleId, 'text', 'Welcome to Algebra', 'This module introduces basic algebraic concepts including variables, expressions, and equations.', 1]
    );
    
    console.log('✓ Default users created');
    console.log('✓ Sample course and module created');
    console.log('\nDefault login credentials:');
    console.log('Username: headteacher / Password: password123');
    console.log('Username: deputy / Password: password123');
    console.log('Username: finance / Password: password123');
    console.log('Username: teacher1 / Password: password123');
    console.log('Username: student1 / Password: password123');
    console.log('Username: parent1 / Password: password123');
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedData()
  .then(() => {
    console.log('\nDatabase seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });

