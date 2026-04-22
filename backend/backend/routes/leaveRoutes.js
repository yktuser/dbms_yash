// routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all leaves (with employee name)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, e.name as employee_name, e.department
      FROM leaves l
      JOIN employees e ON l.emp_id = e.emp_id
      ORDER BY l.applied_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET leaves for specific employee
router.get('/employee/:emp_id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM leaves WHERE emp_id = ? ORDER BY applied_at DESC',
      [req.params.emp_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST apply leave
router.post('/', async (req, res) => {
  const { emp_id, leave_type, start_date, end_date, reason } = req.body;
  if (!emp_id || !leave_type || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }
  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({ success: false, message: 'End date cannot be before start date' });
  }
  try {
    // Check employee exists
    const [emp] = await db.query('SELECT emp_id FROM employees WHERE emp_id = ?', [emp_id]);
    if (emp.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });

    const [result] = await db.query(
      'INSERT INTO leaves (emp_id, leave_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
      [emp_id, leave_type, start_date, end_date, reason]
    );
    res.status(201).json({ success: true, message: 'Leave applied successfully', leave_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update leave status (approve/reject)
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  try {
    const [result] = await db.query('UPDATE leaves SET status = ? WHERE leave_id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Leave not found' });
    res.json({ success: true, message: `Leave ${status} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE leave
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM leaves WHERE leave_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Leave not found' });
    res.json({ success: true, message: 'Leave deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET leave stats
router.get('/stats/summary', async (req, res) => {
  try {
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM leaves');
    const [[{ pending }]] = await db.query("SELECT COUNT(*) as pending FROM leaves WHERE status='pending'");
    const [[{ approved }]] = await db.query("SELECT COUNT(*) as approved FROM leaves WHERE status='approved'");
    const [[{ rejected }]] = await db.query("SELECT COUNT(*) as rejected FROM leaves WHERE status='rejected'");
    res.json({ success: true, data: { total, pending, approved, rejected } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
