-- Employee Payroll & Leave Management System
-- Database Schema

CREATE DATABASE IF NOT EXISTS payroll_db;
USE payroll_db;

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  emp_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  department VARCHAR(50) NOT NULL,
  designation VARCHAR(50) NOT NULL,
  basic_salary DECIMAL(10, 2) NOT NULL,
  date_of_joining DATE NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaves Table
CREATE TABLE IF NOT EXISTS leaves (
  leave_id INT AUTO_INCREMENT PRIMARY KEY,
  emp_id INT NOT NULL,
  leave_type ENUM('sick', 'casual', 'earned', 'maternity', 'paternity') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_id) REFERENCES employees(emp_id) ON DELETE CASCADE
);

-- Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
  payroll_id INT AUTO_INCREMENT PRIMARY KEY,
  emp_id INT NOT NULL,
  month VARCHAR(7) NOT NULL,  -- Format: YYYY-MM
  basic_salary DECIMAL(10, 2) NOT NULL,
  hra DECIMAL(10, 2) NOT NULL,
  da DECIMAL(10, 2) NOT NULL,
  deductions DECIMAL(10, 2) NOT NULL,
  net_salary DECIMAL(10, 2) NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_id) REFERENCES employees(emp_id) ON DELETE CASCADE,
  UNIQUE KEY unique_payroll (emp_id, month)
);

-- Sample Data
INSERT INTO employees (name, email, phone, department, designation, basic_salary, date_of_joining) VALUES
('Arjun Sharma', 'arjun.sharma@company.com', '9876543210', 'Engineering', 'Senior Developer', 75000.00, '2021-03-15'),
('Priya Mehta', 'priya.mehta@company.com', '9123456789', 'HR', 'HR Manager', 60000.00, '2020-07-01'),
('Rahul Gupta', 'rahul.gupta@company.com', '9988776655', 'Finance', 'Financial Analyst', 55000.00, '2022-01-10'),
('Sneha Patel', 'sneha.patel@company.com', '9871234560', 'Engineering', 'Junior Developer', 45000.00, '2023-06-20'),
('Vikram Singh', 'vikram.singh@company.com', '9765432109', 'Sales', 'Sales Executive', 40000.00, '2022-11-05');
