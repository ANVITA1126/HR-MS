import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Clock, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { formatDate } from '../utils/formatters';

const Navbar = ({ setIsSidebarOpen }) => {
  const { user } = useAuth();
  const [attendanceStatus, setAttendanceStatus] = useState({
    isCheckedIn: false,
    isCheckedOut: false,
    loading: true
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchTodayAttendance = async () => {
    try {
      const res = await api.get('/attendance/today');
      if (res.data.success) {
        setAttendanceStatus({
          isCheckedIn: res.data.isCheckedIn,
          isCheckedOut: res.data.isCheckedOut,
          record: res.data.attendance,
          loading: false
        });
      }
    } catch {
      setAttendanceStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage('');
    try {
      const res = await api.post('/attendance/check-in');
      if (res.data.success) {
        setMessage('Checked in!');
        fetchTodayAttendance();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 3500);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setMessage('');
    try {
      const res = await api.post('/attendance/check-out');
      if (res.data.success) {
        setMessage('Checked out!');
        fetchTodayAttendance();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 3500);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left side: Mobile Toggle & Date */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Welcome back, <span className="text-indigo-600">{user?.name}</span>
          </h2>
          <p className="text-xs text-slate-400 hidden sm:block">
            {formatDate(new Date(), 'EEEE, MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      {/* Right side: Attendance Quick Punch & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Punch Button */}
        <div className="flex items-center gap-2">
          {message && (
            <span className="text-xs font-semibold text-indigo-600 animate-pulse hidden md:inline">
              {message}
            </span>
          )}

          {!attendanceStatus.isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Punch In</span>
            </button>
          ) : !attendanceStatus.isCheckedOut ? (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm shadow-rose-600/20 transition disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Punch Out</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Completed Today</span>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-700 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
