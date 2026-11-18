import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { formatCurrency, formatDate, formatTime, getStatusBadge } from '../utils/formatters';
import {
  Users,
  UserCheck,
  CalendarDays,
  Clock,
  IndianRupee,
  Building2,
  Bell,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, isAdminOrManager } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const endpoint = isAdminOrManager ? '/dashboard/admin' : '/dashboard/employee';
      const res = await api.get(endpoint);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isAdminOrManager]);

  const handleLeaveDecision = async (leaveId, status) => {
    try {
      setActionLoading(true);
      await api.put(`/leaves/${leaveId}/status`, { status });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update leave status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
        {error}
      </div>
    );
  }

  // -------------------------------------------------------------
  // ADMIN & MANAGER VIEW
  // -------------------------------------------------------------
  if (isAdminOrManager && data?.stats) {
    const { stats, departmentDistribution, attendanceTrend, recentLeaves, recentAnnouncements, recentEmployees } = data;

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Overview</h1>
            <p className="text-sm text-slate-500">Live operational metrics, workforce attendance, and pending requests</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/employees"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              + Add Employee
            </Link>
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            subtext={`${stats.activeEmployees} active employees`}
            icon={Users}
            color="indigo"
          />
          <StatCard
            title="Present Today"
            value={stats.presentToday + stats.lateToday}
            subtext={`${stats.lateToday} checked in late (${stats.attendanceRate}% turnout)`}
            icon={UserCheck}
            color="emerald"
          />
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaves}
            subtext="Awaiting review & approval"
            icon={CalendarDays}
            color="amber"
          />
          <StatCard
            title="Yearly Payroll Total"
            value={formatCurrency(stats.totalPayrollSpent)}
            subtext="Disbursed & processed"
            icon={IndianRupee}
            color="purple"
          />
        </div>

        {/* Middle Section: Attendance Trend & Department Headcount */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 7-Day Attendance Trend */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">7-Day Attendance Turnout</h3>
                <p className="text-xs text-slate-500">Daily employee presence overview</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                This Week
              </span>
            </div>
            <div className="grid grid-cols-7 gap-2 pt-4">
              {attendanceTrend?.map((item) => {
                const percent = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
                return (
                  <div key={item.date} className="flex flex-col items-center gap-2">
                    <div className="text-[11px] font-bold text-slate-700">{item.present}</div>
                    <div className="w-full bg-slate-100 rounded-full h-28 flex flex-col justify-end p-1">
                      <div
                        className="w-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ height: `${Math.max(percent, 12)}%` }}
                        title={`${item.present}/${item.total} (${percent}%)`}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{item.day}</span>
                    <span className="text-[10px] text-slate-400">{item.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Headcount by Dept</h3>
              <Building2 className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-3.5">
              {departmentDistribution?.map((dept) => {
                const ratio = stats.totalEmployees > 0 ? (dept.count / stats.totalEmployees) * 100 : 0;
                return (
                  <div key={dept.id || dept.name}>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700">{dept.name}</span>
                      <span className="text-slate-500">{dept.count} members</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lower Grid: Pending Leaves & Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leave Requests */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Leave Requests</h3>
                <p className="text-xs text-slate-500">Review requests requiring approval</p>
              </div>
              <Link to="/leaves" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View All
              </Link>
            </div>

            {recentLeaves && recentLeaves.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentLeaves.map((leave) => (
                  <div key={leave._id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {leave.employee?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {leave.leaveType} Leave • {leave.totalDays} day(s) ({formatDate(leave.startDate, 'dd MMM')} - {formatDate(leave.endDate, 'dd MMM')})
                      </p>
                      <p className="text-xs text-slate-400 italic truncate mt-0.5">"{leave.reason}"</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {leave.status === 'Pending' ? (
                        <>
                          <button
                            onClick={() => handleLeaveDecision(leave._id, 'Approved')}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleLeaveDecision(leave._id, 'Rejected')}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${getStatusBadge(leave.status)}`}>
                          {leave.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">No pending leave requests.</div>
            )}
          </div>

          {/* Company Announcements */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Notice Board</h3>
                <p className="text-xs text-slate-500">Active company announcements</p>
              </div>
              <Link to="/announcements" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {recentAnnouncements?.map((item) => (
                <div key={item._id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{item.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.priority === 'High'
                          ? 'bg-rose-100 text-rose-700'
                          : item.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {item.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.content}</p>
                  <p className="text-[10px] text-slate-400 mt-2">{formatDate(item.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // EMPLOYEE PERSONAL VIEW
  // -------------------------------------------------------------
  const { todayAttendance, monthSummary, leaveBalance, recentLeaves, recentPayslip, announcements } = data || {};

  return (
    <div className="space-y-6">
      {/* Employee Greeting Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-violet-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              Employee Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
              Hello, {user?.name}! 👋
            </h1>
            <p className="text-indigo-100 text-sm mt-1">
              {user?.designation} • {user?.department?.name || 'Main Office'} • ID: {user?.employeeId}
            </p>
          </div>

          {/* Quick Punch Status Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center sm:text-right">
            <p className="text-xs text-indigo-200">Today's Attendance Status</p>
            <p className="text-lg font-bold">
              {todayAttendance?.isCheckedIn
                ? todayAttendance?.isCheckedOut
                  ? 'Checked Out (Done)'
                  : 'Currently Checked In'
                : 'Not Checked In Yet'}
            </p>
            {todayAttendance?.record?.checkIn && (
              <p className="text-xs text-indigo-200 mt-1">
                Punch In: {formatTime(todayAttendance.record.checkIn)}
                {todayAttendance.record.checkOut && ` • Punch Out: ${formatTime(todayAttendance.record.checkOut)}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Casual Leaves</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{leaveBalance?.casual ?? 12} days</h3>
              <p className="text-xs text-slate-500 mt-1">Available balance</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              CL
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Sick Leaves</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{leaveBalance?.sick ?? 10} days</h3>
              <p className="text-xs text-slate-500 mt-1">Available balance</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              SL
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Earned / Paid Leaves</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{leaveBalance?.paid ?? 15} days</h3>
              <p className="text-xs text-slate-500 mt-1">Available balance</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              PL
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Monthly Summary & Latest Payslip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Attendance Log */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Current Month Activity</h3>
            <Link to="/attendance" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Full Log
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-xs font-medium text-slate-500">Days Present</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{monthSummary?.daysPresent || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-xs font-medium text-slate-500">Hours Clocked</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{monthSummary?.totalHours || 0} hrs</p>
            </div>
          </div>
        </div>

        {/* Recent Payslip Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Latest Salary Slip</h3>
            <Link to="/payroll" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              All Payslips
            </Link>
          </div>

          {recentPayslip ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">
                  {recentPayslip.month} {recentPayslip.year}
                </p>
                <p className="text-lg font-bold text-emerald-600 mt-0.5">
                  {formatCurrency(recentPayslip.netSalary)}
                </p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${getStatusBadge(recentPayslip.paymentStatus)}`}>
                  {recentPayslip.paymentStatus}
                </span>
              </div>
              <Link
                to={`/payroll`}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Slip</span>
              </Link>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">No payslips issued yet.</div>
          )}
        </div>
      </div>

      {/* Announcements Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Company Announcements</h3>
          <Bell className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements?.map((item) => (
            <div key={item._id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">{item.title}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  {item.priority}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">{item.content}</p>
              <p className="text-[10px] text-slate-400 mt-2">{formatDate(item.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
