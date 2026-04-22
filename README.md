# Employee Payroll & Leave Management System

## Overview

This project is a web-based system designed to manage employee records, payroll processing, and leave tracking. It demonstrates core DBMS concepts such as relational schema design, normalization, and CRUD operations using MySQL.

---

## Tech Stack

**Frontend**

* HTML
* CSS
* JavaScript

**Backend**

* Node.js
* Express.js

**Database**

* MySQL

---

## Features

* Add and manage employee records
* View employee details
* Apply for leave
* Store leave records
* Generate payroll automatically
* Calculate salary components (HRA, DA, deductions)

---

## Project Structure

```
payroll-system/
│
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── routes/
│   │   ├── employeeRoutes.js
│   │   ├── leaveRoutes.js
│   │   └── payrollRoutes.js
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── style.css
│   ├── script.js
│
├── database/
│   └── schema.sql
│
└── README.md
```

---

## Installation & Setup

### 1. Clone Repository

```
git clone https://github.com/your-username/payroll-system.git
cd payroll-system
```

### 2. Install Backend Dependencies

```
npm install express mysql2 cors
```

### 3. Setup Database

* Open MySQL
* Run the `schema.sql` file

### 4. Start Backend Server

```
node server.js
```

Server will run at:

```
http://localhost:3000
```

### 5. Run Frontend

* Open `frontend/index.html` in your browser


## API Endpoints

### Employee

* `POST /api/employees` → Add employee
* `GET /api/employees` → Get all employees

### Leave

* `POST /api/leaves` → Apply leave

### Payroll

* `POST /api/payroll/:emp_id` → Generate payroll


## Database Design

### Tables

* `employees`
* `leaves`
* `payroll`

### Relationships

* One employee → Many leaves
* One employee → Many payroll records


## Salary Calculation Logic

* HRA = 20% of basic salary
* DA = 10% of basic salary
* Deductions = 5% of basic salary

**Net Salary = Basic + HRA + DA − Deductions**


## Future Improvements

* Authentication system (login/signup)
* Role-based access (Admin / Employee)
* Leave approval workflow
* Salary slip PDF generation
* Dashboard with charts
* Responsive UI (Bootstrap/React)

  Er diagram
  <img width="826" height="496" alt="1000130825" src="https://github.com/user-attachments/assets/077ddcd4-2c5d-42b0-be67-82037bdc3904" />





