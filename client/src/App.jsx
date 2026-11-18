import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/Employees/EmployeeList';
import DepartmentList from './pages/Departments/DepartmentList';
import AttendanceList from './pages/Attendance/AttendanceList';
import LeaveList from './pages/Leaves/LeaveList';
import PayrollList from './pages/Payroll/PayrollList';
import AnnouncementList from './pages/Announcements/AnnouncementList';
import Profile from './pages/Profile/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Main App Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Management Routes */}
              <Route path="/employees" element={<EmployeeList />} />
              <Route path="/departments" element={<DepartmentList />} />

              {/* General Staff & Management Routes */}
              <Route path="/attendance" element={<AttendanceList />} />
              <Route path="/leaves" element={<LeaveList />} />
              <Route path="/payroll" element={<PayrollList />} />
              <Route path="/announcements" element={<AnnouncementList />} />
              <Route path="/profile" element={<Profile />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
