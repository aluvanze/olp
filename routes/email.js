const express = require('express');
const nodemailer = require('nodemailer');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Get inbox messages
router.get('/inbox', async (req, res) => {
  try {
    const { is_read, is_important } = req.query;
    
    let query = `
      SELECT m.*, u.first_name as sender_first_name, u.last_name as sender_last_name, u.email as sender_email
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.recipient_id = $1
    `;
    const params = [req.user.id];
    let paramCount = 2;
    
    if (is_read !== undefined) {
      query += ` AND m.is_read = $${paramCount}`;
      params.push(is_read === 'true');
      paramCount++;
    }
    
    if (is_important !== undefined) {
      query += ` AND m.is_important = $${paramCount}`;
      params.push(is_important === 'true');
      paramCount++;
    }
    
    query += ' ORDER BY m.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get inbox error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sent messages
router.get('/sent', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, u.first_name as recipient_first_name, u.last_name as recipient_last_name, u.email as recipient_email
       FROM messages m
       INNER JOIN users u ON m.recipient_id = u.id
       WHERE m.sender_id = $1
       ORDER BY m.created_at DESC`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get message by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, 
              sender.first_name as sender_first_name, sender.last_name as sender_last_name, sender.email as sender_email,
              recipient.first_name as recipient_first_name, recipient.last_name as recipient_last_name, recipient.email as recipient_email
       FROM messages m
       LEFT JOIN users sender ON m.sender_id = sender.id
       LEFT JOIN users recipient ON m.recipient_id = recipient.id
       WHERE m.id = $1 AND (m.recipient_id = $2 OR m.sender_id = $2)`,
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    const message = result.rows[0];
    
    // Mark as read if recipient
    if (message.recipient_id === req.user.id && !message.is_read) {
      await pool.query(
        'UPDATE messages SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1',
        [req.params.id]
      );
      message.is_read = true;
    }
    
    res.json(message);
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/send', async (req, res) => {
  try {
    const { recipient_id, subject, message_body, is_important, send_email } = req.body;
    
    if (!recipient_id || !subject || !message_body) {
      return res.status(400).json({ message: 'Recipient, subject, and message body are required' });
    }
    
    // Verify recipient exists
    const recipientCheck = await pool.query('SELECT id, email, first_name, last_name FROM users WHERE id = $1', [recipient_id]);
    if (recipientCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    const recipient = recipientCheck.rows[0];
    
    // Save message to database
    const result = await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, subject, message_body, is_important)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, recipient_id, subject, message_body, is_important || false]
    );
    
    const message = result.rows[0];
    
    // Send email notification if requested and email is configured
    if (send_email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const senderInfo = await pool.query(
          'SELECT first_name, last_name, email FROM users WHERE id = $1',
          [req.user.id]
        );
        const sender = senderInfo.rows[0];
        
        await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM || 'Grade 10 LMS'}" <${process.env.EMAIL_USER}>`,
          to: recipient.email,
          subject: `[Grade 10 LMS] ${subject}`,
          html: `
            <h2>New Message from ${sender.first_name} ${sender.last_name}</h2>
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
              ${message_body.replace(/\n/g, '<br>')}
            </div>
            <p><em>This is an automated message from the Grade 10 Learning Management System.</em></p>
          `
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request if email fails
      }
    }
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE messages 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND recipient_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as important
router.put('/:id/important', async (req, res) => {
  try {
    const { is_important } = req.body;
    
    const result = await pool.query(
      `UPDATE messages 
       SET is_important = $1
       WHERE id = $2 AND (recipient_id = $3 OR sender_id = $3)
       RETURNING *`,
      [is_important, req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark message important error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message
router.delete('/:id', async (req, res) => {
  try {
    // Users can delete messages they sent or received
    const result = await pool.query(
      `DELETE FROM messages 
       WHERE id = $1 AND (sender_id = $2 OR recipient_id = $2)
       RETURNING id`,
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count
router.get('/unread/count', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM messages WHERE recipient_id = $1 AND is_read = false`,
      [req.user.id]
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

