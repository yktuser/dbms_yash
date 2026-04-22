// script.js — PayrollPro Frontend Logic
const API = 'http://localhost:3000/api';

let allEmployees = [];

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentDate').textContent =
    new Date().toLocaleDateString('en-IN', { weekday:'short', year:'numeric', month:'short', day:'numeric' });

  // Default payroll month to current
  const now = new Date();
  const m = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  document.getElementById('payrollMonth').value = m;

  navigate('dashboard');
});

// ===== NAVIGATION =====
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  const titles = { dashboard:'Dashboard', employees:'Employees', leaves:'Leave Management', payroll:'Payroll' };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  if (page === 'dashboard') loadDashboard();
  if (page === 'employees') loadEmployees();
  if (page === 'leaves') loadLeaves();
  if (page === 'payroll') loadPayroll();

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===== API HELPER =====
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
}

// ===== TOAST =====
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ===== MODAL =====
function openModal(id) {
  document.getElementById(`modal-${id}`).classList.add('open');
}

function closeModal(id) {
  document.getElementById(`modal-${id}`).classList.remove('open');
  const form = document.querySelector(`#modal-${id} form`);
  if (form) form.reset();
  const preview = document.getElementById('salaryPreview');
  if (preview) preview.style.display = 'none';
}

// ===== FORMAT =====
function fmt(n) {
  return '₹' + parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const [empStats, leaveStats, payStats] = await Promise.all([
      api('GET', '/employees/stats/summary'),
      api('GET', '/leaves/stats/summary'),
      api('GET', '/payroll/stats/summary')
    ]);

    document.getElementById('stat-total').textContent = empStats.data.total;
    document.getElementById('stat-active').textContent = empStats.data.active;
    document.getElementById('stat-pending').textContent = leaveStats.data.pending;
    document.getElementById('stat-avg').textContent =
      payStats.data.avg_salary > 0 ? fmt(payStats.data.avg_salary) : '—';

    // Recent employees
    const empData = await api('GET', '/employees');
    const recent = empData.data.slice(0, 5);
    document.getElementById('recentEmployees').innerHTML = recent.length === 0
      ? emptyState('No employees yet')
      : `<div class="table-wrap"><table>
          <thead><tr><th>Name</th><th>Department</th><th>Status</th></tr></thead>
          <tbody>${recent.map(e => `<tr>
            <td class="td-name">${e.name}</td>
            <td><span class="badge badge-dept">${e.department}</span></td>
            <td><span class="badge badge-${e.status}">${e.status}</span></td>
          </tr>`).join('')}</tbody>
        </table></div>`;

    // Recent leaves
    const leaveData = await api('GET', '/leaves');
    const recentL = leaveData.data.slice(0, 5);
    document.getElementById('recentLeaves').innerHTML = recentL.length === 0
      ? emptyState('No leave records yet')
      : `<div class="table-wrap"><table>
          <thead><tr><th>Employee</th><th>Type</th><th>Status</th></tr></thead>
          <tbody>${recentL.map(l => `<tr>
            <td class="td-name">${l.employee_name}</td>
            <td><span class="badge badge-leave">${l.leave_type}</span></td>
            <td><span class="badge badge-${l.status}">${l.status}</span></td>
          </tr>`).join('')}</tbody>
        </table></div>`;
  } catch (e) {
    toast('Failed to load dashboard: ' + e.message, 'error');
  }
}

// ===== EMPLOYEES =====
async function loadEmployees() {
  document.getElementById('employeeTableWrap').innerHTML = '<div class="loading">Loading…</div>';
  try {
    const data = await api('GET', '/employees');
    allEmployees = data.data;
    renderEmployeeTable(allEmployees);
    populateEmployeeSelect();
  } catch (e) {
    toast(e.message, 'error');
  }
}

function renderEmployeeTable(employees) {
  if (employees.length === 0) {
    document.getElementById('employeeTableWrap').innerHTML = emptyState('No employees found');
    return;
  }
  document.getElementById('employeeTableWrap').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>#</th><th>Name</th><th>Department</th><th>Designation</th>
          <th>Basic Salary</th><th>Joined</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>${employees.map(e => `<tr>
          <td style="color:var(--text-muted)">${e.emp_id}</td>
          <td>
            <div class="td-name">${e.name}</div>
            <div style="font-size:11px;color:var(--text-muted)">${e.email}</div>
          </td>
          <td><span class="badge badge-dept">${e.department}</span></td>
          <td>${e.designation}</td>
          <td style="color:var(--accent-yellow);font-weight:600">${fmt(e.basic_salary)}</td>
          <td>${fmtDate(e.date_of_joining)}</td>
          <td><span class="badge badge-${e.status}">${e.status}</span></td>
          <td><div class="td-actions">
            <button class="btn-icon" onclick="openEditEmployee(${e.emp_id})">Edit</button>
            <button class="btn-icon" onclick="openGenPayroll(${e.emp_id},'${e.name}')">Payroll</button>
            <button class="btn-danger" onclick="deleteEmployee(${e.emp_id},'${e.name}')">Del</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
}

function filterEmployees() {
  const q = document.getElementById('empSearch').value.toLowerCase();
  const filtered = allEmployees.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.department.toLowerCase().includes(q) ||
    e.designation.toLowerCase().includes(q) ||
    e.email.toLowerCase().includes(q)
  );
  renderEmployeeTable(filtered);
}

async function submitAddEmployee(e) {
  e.preventDefault();
  const form = document.getElementById('addEmployeeForm');
  const fd = new FormData(form);
  const body = Object.fromEntries(fd.entries());
  try {
    await api('POST', '/employees', body);
    toast('Employee added successfully!');
    closeModal('addEmployee');
    loadEmployees();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// Salary preview on add form
document.addEventListener('DOMContentLoaded', () => {
  const salInput = document.querySelector('#addEmployeeForm [name="basic_salary"]');
  if (salInput) {
    salInput.addEventListener('input', () => {
      const basic = parseFloat(salInput.value);
      const preview = document.getElementById('salaryPreview');
      if (!basic || basic <= 0) { preview.style.display = 'none'; return; }
      const hra = basic * 0.20, da = basic * 0.10, ded = basic * 0.05;
      const net = basic + hra + da - ded;
      preview.style.display = 'block';
      preview.innerHTML = `<div class="salary-preview-title">Salary Breakdown Preview</div>
        <div class="salary-row"><span>Basic</span><span>${fmt(basic)}</span></div>
        <div class="salary-row"><span>HRA (20%)</span><span>+ ${fmt(hra)}</span></div>
        <div class="salary-row"><span>DA (10%)</span><span>+ ${fmt(da)}</span></div>
        <div class="salary-row"><span>Deductions (5%)</span><span>- ${fmt(ded)}</span></div>
        <div class="salary-row total"><span>Net Salary</span><span>${fmt(net)}</span></div>`;
    });
  }
});

async function openEditEmployee(id) {
  const emp = allEmployees.find(e => e.emp_id === id);
  if (!emp) return;
  const form = document.getElementById('editEmployeeForm');
  form.querySelector('[name="emp_id"]').value = emp.emp_id;
  form.querySelector('[name="name"]').value = emp.name;
  form.querySelector('[name="email"]').value = emp.email;
  form.querySelector('[name="phone"]').value = emp.phone || '';
  form.querySelector('[name="department"]').value = emp.department;
  form.querySelector('[name="designation"]').value = emp.designation;
  form.querySelector('[name="basic_salary"]').value = emp.basic_salary;
  form.querySelector('[name="status"]').value = emp.status;
  openModal('editEmployee');
}

async function submitEditEmployee(e) {
  e.preventDefault();
  const form = document.getElementById('editEmployeeForm');
  const fd = new FormData(form);
  const body = Object.fromEntries(fd.entries());
  const id = body.emp_id;
  try {
    await api('PUT', `/employees/${id}`, body);
    toast('Employee updated!');
    closeModal('editEmployee');
    loadEmployees();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteEmployee(id, name) {
  if (!confirm(`Delete employee "${name}"? This cannot be undone.`)) return;
  try {
    await api('DELETE', `/employees/${id}`);
    toast(`${name} deleted.`);
    loadEmployees();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ===== LEAVES =====
async function loadLeaves() {
  document.getElementById('leaveTableWrap').innerHTML = '<div class="loading">Loading…</div>';
  try {
    const [leaveData, statsData] = await Promise.all([
      api('GET', '/leaves'),
      api('GET', '/leaves/stats/summary')
    ]);

    const s = statsData.data;
    document.getElementById('leaveStatsBar').innerHTML = `
      <div class="leave-stat-item"><span class="leave-stat-num" style="color:var(--accent-blue)">${s.total}</span> Total</div>
      <div class="leave-stat-item"><span class="leave-stat-num" style="color:var(--accent-yellow)">${s.pending}</span> Pending</div>
      <div class="leave-stat-item"><span class="leave-stat-num" style="color:var(--accent-green)">${s.approved}</span> Approved</div>
      <div class="leave-stat-item"><span class="leave-stat-num" style="color:var(--danger)">${s.rejected}</span> Rejected</div>`;

    const leaves = leaveData.data;
    if (leaves.length === 0) {
      document.getElementById('leaveTableWrap').innerHTML = emptyState('No leave records found');
      return;
    }

    document.getElementById('leaveTableWrap').innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr>
          <th>#</th><th>Employee</th><th>Type</th><th>From</th><th>To</th>
          <th>Days</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>${leaves.map(l => {
          const days = Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / 86400000) + 1;
          return `<tr>
            <td style="color:var(--text-muted)">${l.leave_id}</td>
            <td>
              <div class="td-name">${l.employee_name}</div>
              <div style="font-size:11px;color:var(--text-muted)">${l.department}</div>
            </td>
            <td><span class="badge badge-leave">${l.leave_type}</span></td>
            <td>${fmtDate(l.start_date)}</td>
            <td>${fmtDate(l.end_date)}</td>
            <td>${days}</td>
            <td><span class="badge badge-${l.status}">${l.status}</span></td>
            <td><div class="td-actions">
              ${l.status === 'pending' ? `
                <button class="btn-icon" onclick="updateLeaveStatus(${l.leave_id},'approved')">✓ Approve</button>
                <button class="btn-danger" onclick="updateLeaveStatus(${l.leave_id},'rejected')">✗ Reject</button>
              ` : `<span style="color:var(--text-muted);font-size:12px">${l.status}</span>`}
            </div></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function submitApplyLeave(e) {
  e.preventDefault();
  const form = document.getElementById('applyLeaveForm');
  const fd = new FormData(form);
  const body = Object.fromEntries(fd.entries());
  try {
    await api('POST', '/leaves', body);
    toast('Leave applied successfully!');
    closeModal('applyLeave');
    loadLeaves();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function updateLeaveStatus(id, status) {
  try {
    await api('PUT', `/leaves/${id}/status`, { status });
    toast(`Leave ${status}!`, status === 'approved' ? 'success' : 'error');
    loadLeaves();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ===== PAYROLL =====
async function loadPayroll() {
  document.getElementById('payrollTableWrap').innerHTML = '<div class="loading">Loading…</div>';
  try {
    const [payData, statsData] = await Promise.all([
      api('GET', '/payroll'),
      api('GET', '/payroll/stats/summary')
    ]);

    const s = statsData.data;
    document.getElementById('payrollSummary').innerHTML = `
      <div class="payroll-sum-card">
        <div class="payroll-sum-label">Total Records</div>
        <div class="payroll-sum-value">${s.total_records}</div>
      </div>
      <div class="payroll-sum-card">
        <div class="payroll-sum-label">Total Payout</div>
        <div class="payroll-sum-value">${fmt(s.total_payout)}</div>
      </div>
      <div class="payroll-sum-card">
        <div class="payroll-sum-label">Avg Net Salary</div>
        <div class="payroll-sum-value">${fmt(s.avg_salary)}</div>
      </div>`;

    const records = payData.data;
    if (records.length === 0) {
      document.getElementById('payrollTableWrap').innerHTML = emptyState('No payroll records yet. Generate payroll to get started.');
      return;
    }

    document.getElementById('payrollTableWrap').innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr>
          <th>Employee</th><th>Month</th><th>Basic</th><th>HRA</th>
          <th>DA</th><th>Deductions</th><th>Net Salary</th><th>Actions</th>
        </tr></thead>
        <tbody>${records.map(p => `<tr>
          <td>
            <div class="td-name">${p.employee_name}</div>
            <div style="font-size:11px;color:var(--text-muted)">${p.designation}</div>
          </td>
          <td>${p.month}</td>
          <td>${fmt(p.basic_salary)}</td>
          <td style="color:var(--accent-green)">+${fmt(p.hra)}</td>
          <td style="color:var(--accent-blue)">+${fmt(p.da)}</td>
          <td style="color:var(--danger)">-${fmt(p.deductions)}</td>
          <td style="color:var(--accent-yellow);font-weight:700">${fmt(p.net_salary)}</td>
          <td>
            <button class="btn-icon" onclick="showPayslip(${JSON.stringify(p).replace(/"/g,'&quot;')})">View Slip</button>
          </td>
        </tr>`).join('')}</tbody>
      </table></div>`;
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function generateAllPayroll() {
  const month = document.getElementById('payrollMonth').value;
  if (!month) { toast('Select a month first', 'error'); return; }
  if (!confirm(`Generate payroll for ALL active employees for ${month}?`)) return;
  try {
    const data = await api('POST', '/payroll/generate/all', { month });
    toast(`Payroll generated for ${data.data.length} employees!`);
    loadPayroll();
  } catch (e) {
    toast(e.message, 'error');
  }
}

function openGenPayroll(empId, empName) {
  const form = document.getElementById('genPayrollForm');
  form.querySelector('[name="emp_id"]').value = empId;
  form.querySelector('[name="emp_name"]').value = empName;
  const now = new Date();
  form.querySelector('[name="month"]').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  openModal('genPayroll');
}

async function submitGenPayroll(e) {
  e.preventDefault();
  const form = document.getElementById('genPayrollForm');
  const empId = form.querySelector('[name="emp_id"]').value;
  const month = form.querySelector('[name="month"]').value;
  try {
    const data = await api('POST', `/payroll/${empId}`, { month });
    toast(`Payroll generated! Net: ${fmt(data.data.net_salary)}`);
    closeModal('genPayroll');
    if (document.getElementById('page-payroll').classList.contains('active')) loadPayroll();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function showPayslip(p) {
  document.getElementById('payslipContent').innerHTML = `
    <div class="payslip">
      <div class="payslip-header">
        <div class="payslip-company">PayrollPro</div>
        <div class="payslip-sub">Official Salary Slip</div>
        <div class="payslip-month">${formatMonth(p.month)}</div>
      </div>
      <div class="payslip-info">
        <div class="payslip-info-item"><label>Employee</label><p>${p.employee_name}</p></div>
        <div class="payslip-info-item"><label>Department</label><p>${p.department}</p></div>
        <div class="payslip-info-item"><label>Designation</label><p>${p.designation}</p></div>
        <div class="payslip-info-item"><label>Payroll ID</label><p>#${p.payroll_id}</p></div>
      </div>
      <table class="payslip-table">
        <tr><td class="label">Basic Salary</td><td class="amount">${fmt(p.basic_salary)}</td></tr>
        <tr><td class="label">HRA (20%)</td><td class="amount green">+ ${fmt(p.hra)}</td></tr>
        <tr><td class="label">DA (10%)</td><td class="amount green">+ ${fmt(p.da)}</td></tr>
        <tr><td class="label">Deductions (5%)</td><td class="amount red">- ${fmt(p.deductions)}</td></tr>
      </table>
      <div class="payslip-total">
        <span>Net Salary</span>
        <span class="net-amount">${fmt(p.net_salary)}</span>
      </div>
      <div style="text-align:center;margin-top:18px;font-size:11px;color:var(--text-muted)">
        Generated on ${new Date(p.generated_at).toLocaleDateString('en-IN')} · PayrollPro Management System
      </div>
    </div>`;
  openModal('payslip');
}

function formatMonth(m) {
  const [y, mo] = m.split('-');
  return new Date(y, mo-1, 1).toLocaleString('en-IN', { month:'long', year:'numeric' });
}

// ===== EMPLOYEE SELECT (for leaves) =====
function populateEmployeeSelect() {
  const sel = document.getElementById('leaveEmpSelect');
  sel.innerHTML = '<option value="">Select employee</option>' +
    allEmployees.filter(e => e.status === 'active').map(e =>
      `<option value="${e.emp_id}">${e.name} (${e.department})</option>`
    ).join('');
}

// Open apply leave modal with fresh employee list
const origOpenModal = openModal;
window.openModal = function(id) {
  if (id === 'applyLeave' && allEmployees.length === 0) {
    api('GET', '/employees').then(d => {
      allEmployees = d.data;
      populateEmployeeSelect();
    });
  }
  origOpenModal(id);
};

// ===== EMPTY STATE =====
function emptyState(msg) {
  return `<div class="empty-state">
    <div class="empty-state-icon">○</div>
    <p>${msg}</p>
  </div>`;
}
