# 🏢 HR Nexus - Full Stack MERN HR Management System (HRMS)

A modern, production-grade **Human Resource Management System (HRMS)** built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) and styled with **Tailwind CSS**.

---

## 🌟 Key Features

### 1. 🔐 Authentication & Role-Based Access Control (RBAC)
- **Three Core Roles**: `Admin / HR Director`, `Manager / Team Lead`, `Employee`.
- Secure JWT token authentication with bcrypt password hashing.
- **One-Click Demo Credentials** on the login screen for rapid testing.
- Protected client-side routes and API endpoints.

### 2. 👥 Employee Directory & Profile Management
- Complete employee directory with search (by name, email, employee ID, designation) and filters (department, status, role).
- Detailed employee profile: Personal info, Contact, Department, Designation, Salary, Date of Joining, Bank Details, Emergency Contacts.
- Add, edit, and deactivate employee records.

### 3. 🏛️ Department & Team Management
- Create, view, update, and manage company departments.
- Head of Department (HOD) assignment.
- Real-time team headcount metrics and employee association safeguards.

### 4. ⏱️ Attendance & Time Tracking
- **Interactive Daily Punch In / Punch Out** with live timestamp logging.
- Automatic work hour calculation and status detection (`Present`, `Late`, `Half-Day`, `Absent`).
- Monthly attendance breakdown for employees (total days, hours worked, late days).
- **Admin Manual Attendance Adjustment** to mark attendance for any employee.

### 5. 📅 Leave Management & Quota Tracking
- Quota tracking for **Casual Leave (CL)**, **Sick Leave (SL)**, and **Paid / Earned Leave (PL)**.
- Employee leave application with real-time balance validation.
- Admin / Manager approval workflow: 1-click **Approve** or **Reject** with review remarks.
- Automatic quota deduction upon leave approval.

### 6. 💳 Payroll & Salary Management
- Automated salary breakdown calculation:
  - **Earnings**: Basic Salary, HRA (40%), Conveyance Allowance, Medical Allowance, Special Allowance.
  - **Deductions**: Provident Fund (12%), Income Tax (5%), Other Deductions.
  - **Net Take-Home Pay**.
- **Bulk Payroll Generation** for all active staff in 1 click or single-employee generation.
- **Printable Corporate Payslip** modal with company branding, breakdowns, and browser print format (`window.print()`).
- Payment status tracking (`Pending`, `Processed`, `Paid`).

### 7. 📢 Company Notice Board & Announcements
- Publish global or department-targeted official notices.
- Priority indicators: `Urgent`, `High`, `Medium`, `Low`.

### 8. 📊 Analytics & Interactive Dashboards
- **Executive Admin View**: Real-time KPI stat cards, 7-day attendance trend chart, department distribution progress, pending leave requests queue, and recent hires.
- **Employee Self-Service View**: Shift punch status, available leave balances, monthly hours clocked, and latest salary slip.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons, React Router v6, Axios, Date-fns
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JSON Web Tokens (JWT), Bcrypt.js, Multer, Morgan, Cors, Dotenv

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local instance or free MongoDB Atlas URI)

### 1. Clone & Setup
```bash
git clone https://github.com/ANVITA1126/HR-MS.git
cd HR-MS
```

### 2. Install Dependencies
```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables
Inside `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hrms
JWT_SECRET=supersecret_hrms_jwt_token_key_2025
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```
*(If using MongoDB Atlas, replace `MONGO_URI` with your connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/hrms`)*

### 4. Seed Realistic Sample Data
Preload realistic departments, staff, 7-day attendance logs, leaves, payroll, and announcements:
```bash
cd server
npm run seed
```

### 5. Run the Application
In separate terminals:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔑 Pre-Configured Demo Credentials

You can log in directly using the 1-click buttons on the login screen or with these credentials:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@hrms.com` | `admin123` | Full system access, employee/dept management, payroll, approvals |
| **Manager** | `manager@hrms.com` | `manager123` | Team oversight, attendance view, leave review, employee directory |
| **Employee** | `aanya@hrms.com` | `employee123` | Self-service portal: punch-in/out, apply leave, view payslips |

---

## 📁 Project Architecture

```
HR-MS/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── api/axios.js         # Axios interceptor with JWT handling
│   │   ├── components/          # Reusable UI (Sidebar, Navbar, Modal, StatCard, etc.)
│   │   ├── context/AuthContext  # Global authentication & user state
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Login page with 1-click demo logins
│   │   │   ├── Dashboard.jsx    # Dynamic Role-based Analytics Dashboard
│   │   │   ├── Employees/       # Employee list, add, edit, delete
│   │   │   ├── Departments/     # Department management & HODs
│   │   │   ├── Attendance/      # Check-in/out, logs & admin adjustments
│   │   │   ├── Leaves/          # Leave applications & approval workflows
│   │   │   ├── Payroll/         # Payroll list, generator & printable payslips
│   │   │   ├── Announcements/   # Company notice board
│   │   │   └── Profile/         # Profile & password management
│   │   ├── utils/formatters.js  # Currency, date, and badge formatting
│   │   ├── App.jsx              # Routes configuration
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                      # Express.js REST API
│   ├── config/db.js             # MongoDB connection
│   ├── controllers/             # Business logic controllers
│   ├── middleware/              # Auth, RBAC, Upload, and Error middlewares
│   ├── models/                  # Mongoose models (User, Dept, Attendance, Leave, Payroll, Announcement)
│   ├── routes/                  # Express REST routes
│   ├── utils/seeder.js          # Realistic database seeder
│   ├── uploads/                 # Storage for uploads
│   └── server.js                # App entry point
│
├── .gitignore
├── package.json
└── README.md
```

---

## 📡 REST API Summary

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT | Public |
| `GET` | `/api/auth/me` | Fetch currently logged in user profile | Private |
| `PUT` | `/api/auth/profile` | Update personal profile details | Private |
| `PUT` | `/api/auth/change-password` | Update account password | Private |
| `GET` | `/api/dashboard/admin` | Executive analytics & headcount metrics | Admin/Manager |
| `GET` | `/api/dashboard/employee`| Employee attendance & quota stats | Employee |
| `GET` | `/api/employees` | Search & filter employee directory | Admin/Manager |
| `POST` | `/api/employees` | Create new employee profile | Admin/Manager |
| `PUT` | `/api/employees/:id` | Update employee information | Admin/Manager |
| `DELETE`| `/api/employees/:id` | Delete employee record | Admin |
| `GET` | `/api/departments` | List all departments with headcount | Private |
| `POST` | `/api/departments` | Create new department | Admin |
| `POST` | `/api/attendance/check-in` | Punch-in for today | Private |
| `POST` | `/api/attendance/check-out`| Punch-out for today | Private |
| `GET` | `/api/attendance/today` | Current day punch status | Private |
| `GET` | `/api/attendance/my` | Personal monthly attendance log | Private |
| `GET` | `/api/attendance` | All staff attendance with date/dept filter | Admin/Manager |
| `POST` | `/api/attendance/manual` | Manually mark or correct attendance | Admin/Manager |
| `POST` | `/api/leaves` | Submit new leave application | Private |
| `GET` | `/api/leaves/my` | Personal leave history & balances | Private |
| `GET` | `/api/leaves` | All staff leave requests | Admin/Manager |
| `PUT` | `/api/leaves/:id/status`| Approve or reject leave application | Admin/Manager |
| `POST` | `/api/payroll/generate` | Generate monthly payroll (single/bulk) | Admin |
| `GET` | `/api/payroll` | All payroll records & disbursement totals | Admin/Manager |
| `GET` | `/api/payroll/my` | Personal payslips | Private |
| `PUT` | `/api/payroll/:id/status`| Update payout status (Paid/Processed) | Admin |
| `GET` | `/api/announcements` | Active announcements | Private |
| `POST` | `/api/announcements` | Create new company notice | Admin/Manager |

---

## 📄 License
This project is licensed under the MIT License.
