// routes/payrollRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Salary calculation helper
function calculateSalary(basic) {
  const hra = basic * 0.20;
  const da = basic * 0.10;
  const deductions = basic * 0.05;
  const net = basic + hra + da - deductions;
  return { hra, da, deductions, net_salary: net };
}

// GET all payroll records (with employee name)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, e.name as employee_name, e.department, e.designation
      FROM payroll p
      JOIN employees e ON p.emp_id = e.emp_id
      ORDER BY p.generated_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET payroll for specific employee
router.get('/employee/:emp_id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM payroll WHERE emp_id = ? ORDER BY month DESC',
      [req.params.emp_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST generate payroll for employee
router.post('/:emp_id', async (req, res) => {
  const { month } = req.body; // Format: YYYY-MM
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ success: false, message: 'Month must be in YYYY-MM format' });
  }
  try {
    // Get employee
    const [emp] = await db.query('SELECT * FROM employees WHERE emp_id = ?', [req.params.emp_id]);
    if (emp.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });

    const employee = emp[0];
    const { hra, da, deductions, net_salary } = calculateSalary(parseFloat(employee.basic_salary));

    const [result] = await db.query(
      `INSERT INTO payroll (emp_id, month, basic_salary, hra, da, deductions, net_salary)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       basic_salary=VALUES(basic_salary), hra=VALUES(hra), da=VALUES(da),
       deductions=VALUES(deductions), net_salary=VALUES(net_salary), generated_at=NOW()`,
      [req.params.emp_id, month, employee.basic_salary, hra, da, deductions, net_salary]
    );

    res.status(201).json({
      success: true,
      message: 'Payroll generated successfully',
      data: {
        emp_id: req.params.emp_id,
        employee_name: employee.name,
        month,
        basic_salary: employee.basic_salary,
        hra: hra.toFixed(2),
        da: da.toFixed(2),
        deductions: deductions.toFixed(2),
        net_salary: net_salary.toFixed(2)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST generate payroll for ALL active employees
router.post('/generate/all', async (req, res) => {
  const { month } = req.body;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ success: false, message: 'Month must be in YYYY-MM format' });
  }
  try {
    const [employees] = await db.query("SELECT * FROM employees WHERE status='active'");
    const results = [];
    for (const emp of employees) {
      const { hra, da, deductions, net_salary } = calculateSalary(parseFloat(emp.basic_salary));
      await db.query(
        `INSERT INTO payroll (emp_id, month, basic_salary, hra, da, deductions, net_salary)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         basic_salary=VALUES(basic_salary), hra=VALUES(hra), da=VALUES(da),
         deductions=VALUES(deductions), net_salary=VALUES(net_salary), generated_at=NOW()`,
        [emp.emp_id, month, emp.basic_salary, hra, da, deductions, net_salary]
      );
      results.push({ emp_id: emp.emp_id, name: emp.name, net_salary: net_salary.toFixed(2) });
    }
    res.json({ success: true, message: `Payroll generated for ${results.length} employees`, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET payroll stats
router.get('/stats/summary', async (req, res) => {
  try {
    const [[{ total_records }]] = await db.query('SELECT COUNT(*) as total_records FROM payroll');
    const [[{ total_payout }]] = await db.query('SELECT SUM(net_salary) as total_payout FROM payroll');
    const [[{ avg_salary }]] = await db.query('SELECT AVG(net_salary) as avg_salary FROM payroll');
    res.json({
      success: true,
      data: {
        total_records,
        total_payout: parseFloat(total_payout || 0).toFixed(2),
        avg_salary: parseFloat(avg_salary || 0).toFixed(2)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
