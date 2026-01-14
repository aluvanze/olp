const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get financial transactions for a term
router.get('/transactions', authorize('finance', 'headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const { term, academic_year, learner_id } = req.query;
    
    let query = `
      SELECT ft.*, lp.admission_number, u.first_name, u.last_name, u.email
      FROM financial_transactions ft
      INNER JOIN learner_profiles lp ON ft.learner_id = lp.id
      INNER JOIN users u ON lp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (term && academic_year) {
      // Filter by term date range if available
      const termsResult = await pool.query(
        `SELECT start_date, end_date FROM terms 
         WHERE term_number = $1 AND academic_year = $2 AND is_active = true`,
        [term, academic_year]
      );
      
      if (termsResult.rows.length > 0) {
        const termData = termsResult.rows[0];
        query += ` AND ft.transaction_date >= $${paramCount} AND ft.transaction_date <= $${paramCount + 1}`;
        params.push(termData.start_date, termData.end_date);
        paramCount += 2;
      }
    }

    if (learner_id) {
      query += ` AND ft.learner_id = $${paramCount}`;
      params.push(learner_id);
      paramCount++;
    }

    query += ' ORDER BY ft.transaction_date DESC, ft.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get financial transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Record a payment
router.post('/transactions', authorize('finance', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    let { learner_id, user_id, transaction_type, amount, payment_method, mpesa_confirmation_code, reference_number, transaction_date, notes } = req.body;

    // If user_id is provided instead of learner_id, get learner_id from learner_profiles
    if (user_id && !learner_id) {
      const learnerProfile = await pool.query(
        'SELECT id FROM learner_profiles WHERE user_id = $1',
        [user_id]
      );
      if (learnerProfile.rows.length > 0) {
        learner_id = learnerProfile.rows[0].id;
      } else {
        return res.status(400).json({ message: 'Learner profile not found for this user' });
      }
    }

    if (!learner_id || !transaction_type || !amount) {
      return res.status(400).json({ message: 'Learner ID, transaction type, and amount are required' });
    }

    // Check for duplicate M-Pesa confirmation code if provided
    if (mpesa_confirmation_code) {
      const duplicateCheck = await pool.query(
        'SELECT id FROM financial_transactions WHERE mpesa_confirmation_code = $1',
        [mpesa_confirmation_code]
      );
      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({ message: 'M-Pesa confirmation code already exists' });
      }
    }

    const result = await pool.query(
      `INSERT INTO financial_transactions 
       (learner_id, transaction_type, amount, payment_method, mpesa_confirmation_code, reference_number, transaction_date, notes, verified_by, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [learner_id, transaction_type, amount, payment_method || null, mpesa_confirmation_code || null, 
       reference_number || null, transaction_date || new Date().toISOString().split('T')[0], notes || null,
       req.user.id, mpesa_confirmation_code ? true : false] // Auto-verify if M-Pesa code provided
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update transaction (verify, edit)
router.put('/transactions/:id', authorize('finance', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method, mpesa_confirmation_code, reference_number, transaction_date, notes, verified } = req.body;

    // Check for duplicate M-Pesa code if updating
    if (mpesa_confirmation_code) {
      const duplicateCheck = await pool.query(
        'SELECT id FROM financial_transactions WHERE mpesa_confirmation_code = $1 AND id != $2',
        [mpesa_confirmation_code, id]
      );
      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({ message: 'M-Pesa confirmation code already exists' });
      }
    }

    const result = await pool.query(
      `UPDATE financial_transactions
       SET amount = COALESCE($1, amount),
           payment_method = COALESCE($2, payment_method),
           mpesa_confirmation_code = COALESCE($3, mpesa_confirmation_code),
           reference_number = COALESCE($4, reference_number),
           transaction_date = COALESCE($5, transaction_date),
           notes = COALESCE($6, notes),
           verified = COALESCE($7, verified),
           verified_at = CASE WHEN $7 = true AND verified_at IS NULL THEN CURRENT_TIMESTAMP ELSE verified_at END,
           verified_by = CASE WHEN $7 = true AND verified_by IS NULL THEN $8 ELSE verified_by END
       WHERE id = $9
       RETURNING *`,
      [amount, payment_method, mpesa_confirmation_code, reference_number, transaction_date, notes, verified, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get books inventory
router.get('/inventory/books', authorize('finance', 'headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, la.name as learning_area_name, la.code as learning_area_code
       FROM books b
       LEFT JOIN learning_areas la ON b.learning_area_id = la.id
       ORDER BY b.title`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get books inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add/Update book in inventory
router.post('/inventory/books', authorize('finance', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    const { id, title, isbn, learning_area_id, total_copies, available_copies, publisher, edition } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Book title is required' });
    }

    let result;
    if (id) {
      // Update existing book
      result = await pool.query(
        `UPDATE books
         SET title = $1, isbn = $2, learning_area_id = $3, total_copies = $4, 
             available_copies = $5, publisher = $6, edition = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [title, isbn || null, learning_area_id || null, total_copies || 0, available_copies || 0, 
         publisher || null, edition || null, id]
      );
    } else {
      // Create new book
      result = await pool.query(
        `INSERT INTO books (title, isbn, learning_area_id, total_copies, available_copies, publisher, edition)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [title, isbn || null, learning_area_id || null, total_copies || 0, available_copies || 0, 
         publisher || null, edition || null]
      );
    }

    res.status(id ? 200 : 201).json(result.rows[0]);
  } catch (error) {
    console.error('Add/Update book error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get book issuances for a term
router.get('/inventory/issuances', authorize('finance', 'headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    let query = `
      SELECT bi.*, b.title as book_title, b.isbn, lp.admission_number, u.first_name, u.last_name
      FROM book_issuances bi
      INNER JOIN books b ON bi.book_id = b.id
      INNER JOIN learner_profiles lp ON bi.learner_id = lp.id
      INNER JOIN users u ON lp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (term && academic_year) {
      const termsResult = await pool.query(
        `SELECT start_date, end_date FROM terms 
         WHERE term_number = $1 AND academic_year = $2 AND is_active = true`,
        [term, academic_year]
      );
      
      if (termsResult.rows.length > 0) {
        const termData = termsResult.rows[0];
        query += ` AND bi.issue_date >= $${paramCount} AND bi.issue_date <= $${paramCount + 1}`;
        params.push(termData.start_date, termData.end_date);
        paramCount += 2;
      }
    }

    query += ' ORDER BY bi.issue_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get book issuances error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get capitation records (if capitation table exists, otherwise return empty)
router.get('/capitation', authorize('finance', 'headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    // Check if capitation table exists
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'capitation_funds'
      )`
    );

    if (!tableCheck.rows[0].exists) {
      // Return empty array if table doesn't exist
      return res.json([]);
    }

    let query = `
      SELECT * FROM capitation_funds WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (term && academic_year) {
      query += ` AND term = $${paramCount} AND academic_year = $${paramCount + 1}`;
      params.push(term, academic_year);
      paramCount += 2;
    }

    query += ' ORDER BY received_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      return res.json([]);
    }
    console.error('Get capitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Record capitation funds
router.post('/capitation', authorize('finance', 'headteacher', 'superadmin'), async (req, res) => {
  try {
    const { term, academic_year, amount_received, received_date, allocation_details, notes } = req.body;

    if (!term || !academic_year || !amount_received) {
      return res.status(400).json({ message: 'Term, academic year, and amount are required' });
    }

    // Check if capitation table exists, if not create it
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'capitation_funds'
      )`
    );

    if (!tableCheck.rows[0].exists) {
      // Create capitation_funds table
      await pool.query(`
        CREATE TABLE capitation_funds (
          id SERIAL PRIMARY KEY,
          term INTEGER CHECK (term >= 1 AND term <= 3),
          academic_year VARCHAR(20) NOT NULL,
          amount_received DECIMAL(12, 2) NOT NULL,
          received_date DATE DEFAULT CURRENT_DATE,
          allocation_details JSONB,
          notes TEXT,
          recorded_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    const result = await pool.query(
      `INSERT INTO capitation_funds (term, academic_year, amount_received, received_date, allocation_details, notes, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [term, academic_year, amount_received, received_date || new Date().toISOString().split('T')[0],
       allocation_details ? JSON.stringify(allocation_details) : null, notes || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Record capitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get finance dashboard statistics for a term
router.get('/dashboard/stats', authorize('finance', 'headteacher', 'superadmin', 'deputy_headteacher'), async (req, res) => {
  try {
    const { term, academic_year } = req.query;

    if (!term || !academic_year) {
      return res.status(400).json({ message: 'Term and academic year are required' });
    }

    // Get term date range
    const termsResult = await pool.query(
      `SELECT start_date, end_date FROM terms 
       WHERE term_number = $1 AND academic_year = $2 AND is_active = true`,
      [term, academic_year]
    );

    let dateFilter = '';
    const params = [];
    if (termsResult.rows.length > 0) {
      dateFilter = ' AND transaction_date >= $1 AND transaction_date <= $2';
      params.push(termsResult.rows[0].start_date, termsResult.rows[0].end_date);
    }

    // Get payment statistics
    const paymentStats = await pool.query(
      `SELECT 
         COUNT(*) as total_transactions,
         SUM(amount) as total_amount,
         COUNT(*) FILTER (WHERE payment_method = 'mpesa') as mpesa_count,
         COUNT(*) FILTER (WHERE verified = true) as verified_count
       FROM financial_transactions
       WHERE transaction_type = 'fee_payment' ${dateFilter}`,
      params
    );

    // Get book statistics
    const bookStats = await pool.query(
      `SELECT 
         COUNT(*) as total_books,
         SUM(total_copies) as total_copies,
         SUM(available_copies) as available_copies
       FROM books`
    );

    // Get capitation statistics
    let capitationStats = { total_received: 0, records_count: 0 };
    try {
      const capResult = await pool.query(
        `SELECT 
           COUNT(*) as records_count,
           SUM(amount_received) as total_received
         FROM capitation_funds
         WHERE term = $1 AND academic_year = $2`,
        [term, academic_year]
      );
      if (capResult.rows.length > 0) {
        capitationStats = capResult.rows[0];
      }
    } catch (e) {
      // Capitation table might not exist
    }

    res.json({
      payments: paymentStats.rows[0] || {},
      books: bookStats.rows[0] || {},
      capitation: capitationStats
    });
  } catch (error) {
    console.error('Get finance dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
