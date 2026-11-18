import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import { formatDate, formatTime, getStatusBadge } from '../../utils/formatters';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Edit3
} from 'lucide-react';

const AttendanceList = () => {
  const { user, isAdminOrManager } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdminOrManager ? 'all' : 'my');

  // Today punch status
  const [todayRecord, setTodayRecord] = useState(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMsg, setPunchMsg] = useState('');

  // My Attendance data
  const [myRecords, setMyRecords] = useState([]);
  const [mySummary, setMySummary] = useState(null);
  const [myMonth, setMyMonth] = useState(new Date().getMonth() + 1);
  const [myYear, setMyYear] = useState(new Date().getFullYear());

  // All Attendance data (Admin/Manager)
  const [allRecords, setAllRecords] = useState([]);
  const [allDate, setAllDate] = useState(new Date().toISOString().split('T')[0]);
  const [allStatus, setAllStatus] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');

  // Manual mark attendance modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [manualForm, setManualForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    totalHours: 8,
    notes: 'Approved work from home'
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Fetch today punch status
  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/attendance/today');
      if (res.data.success) {
        setTodayRecord(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch current user's monthly attendance
  const fetchMyAttendance = async () => {
    try {
      const res = await api.get('/attendance/my', {
        params: { month: myMonth, year: myYear }
      });
      if (res.data.success) {
        setMyRecords(res.data.records);
        setMySummary(res.data.summary);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch all employees attendance for admin
  const fetchAllAttendance = async () => {
    if (!isAdminOrManager) return;
    try {
      const params = {};
      if (allDate) params.date = allDate;
      if (allStatus) params.status = allStatus;
      if (selectedDept) params.department = selectedDept;

      const res = await api.get('/attendance', { params });
      if (res.data.success) {
        setAllRecords(res.data.records);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuxData = async () => {
    if (isAdminOrManager) {
      const [dRes, eRes] = await Promise.all([
        api.get('/departments'),
        api.get('/employees?limit=100')
      ]);
      if (dRes.data.success) setDepartments(dRes.data.departments);
      if (eRes.data.success) setEmployees(eRes.data.employees);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchAuxData();
  }, []);

  useEffect(() => {
    if (activeTab === 'my') {
      fetchMyAttendance();
    } else {
      fetchAllAttendance();
    }
  }, [activeTab, myMonth, myYear, allDate, allStatus, selectedDept]);

  const handlePunch = async (type) => {
    setPunchLoading(true);
    setPunchMsg('');
    try {
      const endpoint = type === 'in' ? '/attendance/check-in' : '/attendance/check-out';
      const res = await api.post(endpoint);
      if (res.data.success) {
        setPunchMsg(res.data.message);
        fetchTodayStatus();
        fetchMyAttendance();
        if (isAdminOrManager) fetchAllAttendance();
      }
    } catch (err) {
      setPunchMsg(err.response?.data?.message || 'Action failed');
    } finally {
      setPunchLoading(false);
      setTimeout(() => setPunchMsg(''), 4000);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualSubmitting(true);
    try {
      await api.post('/attendance/manual', manualForm);
      setIsManualModalOpen(false);
      fetchAllAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update attendance');
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance & Time Tracking</h1>
          <p className="text-sm text-slate-500">Record work punches, view daily logs, and monitor employee turnout</p>
        </div>

        {isAdminOrManager && (
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Mark Manual Attendance</span>
          </button>
        )}
      </div>

      {/* Live Punch Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Punch</span>
            <h3 className="text-xl font-bold text-slate-800">
              {todayRecord?.isCheckedIn
                ? todayRecord.isCheckedOut
                  ? 'Day Completed'
                  : 'Currently In Shift'
                : 'Not Checked In'}
            </h3>
            <p className="text-xs text-slate-500">
              {todayRecord?.attendance?.checkIn
                ? `Check-in: ${formatTime(todayRecord.attendance.checkIn)}`
                : 'Punches are logged with automatic time calculation'}
              {todayRecord?.attendance?.checkOut &&
                ` • Check-out: ${formatTime(todayRecord.attendance.checkOut)} (${todayRecord.attendance.totalHours} hrs)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {punchMsg && (
            <span className="text-xs font-semibold text-indigo-600 animate-pulse">{punchMsg}</span>
          )}

          {!todayRecord?.isCheckedIn ? (
            <button
              onClick={() => handlePunch('in')}
              disabled={punchLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>Punch In Now</span>
            </button>
          ) : !todayRecord?.isCheckedOut ? (
            <button
              onClick={() => handlePunch('out')}
              disabled={punchLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Punch Out Now</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Punched Out For Today</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4">
        {isAdminOrManager && (
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'all'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            All Staff Attendance
          </button>
        )}
        <button
          onClick={() => setActiveTab('my')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'my'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          My Attendance History
        </button>
      </div>

      {/* TAB 1: ALL STAFF (Admin/Manager) */}
      {activeTab === 'all' && isAdminOrManager && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="w-full md:w-56">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={allDate}
                onChange={(e) => setAllDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="w-full md:w-56">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-48">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
              <select
                value={allStatus}
                onChange={(e) => setAllStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half-Day">Half-Day</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Work Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.employee?.name}</div>
                      <div className="text-[10px] text-slate-400">{r.employee?.employeeId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.employee?.department?.name || 'General'}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{formatTime(r.checkIn)}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{formatTime(r.checkOut)}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{r.totalHours ? `${r.totalHours} hrs` : '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic">{r.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MY ATTENDANCE */}
      {activeTab === 'my' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          {mySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Present</span>
                <p className="text-xl font-bold text-emerald-600 mt-1">{mySummary.present}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Late</span>
                <p className="text-xl font-bold text-amber-600 mt-1">{mySummary.late}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Half-Day</span>
                <p className="text-xl font-bold text-orange-600 mt-1">{mySummary.halfDay}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Absent</span>
                <p className="text-xl font-bold text-rose-600 mt-1">{mySummary.absent}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hours</span>
                <p className="text-xl font-bold text-indigo-600 mt-1">{mySummary.totalHours} hrs</p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Total Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-800">{formatDate(r.date, 'dd MMM yyyy (EEE)')}</td>
                    <td className="py-3 px-4 text-slate-600">{formatTime(r.checkIn)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatTime(r.checkOut)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.totalHours ? `${r.totalHours} hrs` : '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic">{r.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Mark Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Mark Manual Attendance"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee *</label>
            <select
              required
              value={manualForm.employeeId}
              onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.employeeId} - {emp.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
              <select
                value={manualForm.status}
                onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half-Day">Half-Day</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Work Hours</label>
            <input
              type="number"
              step="0.5"
              value={manualForm.totalHours}
              onChange={(e) => setManualForm({ ...manualForm, totalHours: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Reason</label>
            <input
              type="text"
              value={manualForm.notes}
              onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={manualSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl shadow-md"
            >
              {manualSubmitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendanceList;
