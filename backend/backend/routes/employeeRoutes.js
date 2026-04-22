// routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all employees
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single employee
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees WHERE emp_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add employee
router.post('/', async (req, res) => {
  const { name, email, phone, department, designation, basic_salary, date_of_joining } = req.body;
  if (!name || !email || !department || !designation || !basic_salary || !date_of_joining) {
    return res.status(400).json({ success: false, message: 'All required fields must be provided' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO employees (name, email, phone, department, designation, basic_salary, date_of_joining) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, department, designation, basic_salary, date_of_joining]
    );
    res.status(201).json({ success: true, message: 'Employee added successfully', emp_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update employee
router.put('/:id', async (req, res) => {
  const { name, email, phone, department, designation, basic_salary, status } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE employees SET name=?, email=?, phone=?, department=?, designation=?, basic_salary=?, status=? WHERE emp_id=?',
      [name, email, phone, department, designation, basic_salary, status, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM employees WHERE emp_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET employee stats
router.get('/stats/summary', async (req, res) => {
  try {
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM employees');
    const [[{ active }]] = await db.query("SELECT COUNT(*) as active FROM employees WHERE status='active'");
    const [[{ avg_salary }]] = await db.query('SELECT AVG(basic_salary) as avg_salary FROM employees');
    const [departments] = await db.query('SELECT department, COUNT(*) as count FROM employees GROUP BY department');
    res.json({ success: true, data: { total, active, avg_salary: parseFloat(avg_salary).toFixed(2), departments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
