import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import { formatDate, getStatusBadge } from '../../utils/formatters';
import {
  CalendarDays,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Check,
  X
} from 'lucide-react';

const LeaveList = () => {
  const { user, isAdminOrManager } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdminOrManager ? 'all' : 'my');

  // Balances
  const [balances, setBalances] = useState({ casual: 12, sick: 10, paid: 15 });

  // My leaves
  const [myLeaves, setMyLeaves] = useState([]);
  const [loadingMy, setLoadingMy] = useState(false);

  // All leaves (Admin / Manager)
  const [allLeaves, setAllLeaves] = useState([]);
  const [allStatus, setAllStatus] = useState('');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loadingAll, setLoadingAll] = useState(false);

  // Apply Leave Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewLeave, setReviewLeave] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('Approved');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchMyLeaves = async () => {
    try {
      setLoadingMy(true);
      const res = await api.get('/leaves/my');
      if (res.data.success) {
        setMyLeaves(res.data.leaves);
        if (res.data.leaveBalance) setBalances(res.data.leaveBalance);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMy(false);
    }
  };

  const fetchAllLeaves = async () => {
    if (!isAdminOrManager) return;
    try {
      setLoadingAll(true);
      const params = {};
      if (allStatus) params.status = allStatus;

      const res = await api.get('/leaves', { params });
      if (res.data.success) {
        setAllLeaves(res.data.leaves);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
    if (isAdminOrManager) fetchAllLeaves();
  }, [allStatus]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplySubmitting(true);
    setApplyError('');

    try {
      const res = await api.post('/leaves', applyForm);
      if (res.data.success) {
        setIsApplyModalOpen(false);
        setApplyForm({ leaveType: 'Casual', startDate: '', endDate: '', reason: '' });
        fetchMyLeaves();
        if (isAdminOrManager) fetchAllLeaves();
      }
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Failed to apply for leave');
    } finally {
      setApplySubmitting(false);
    }
  };

  const openReviewModal = (leave, decision) => {
    setReviewLeave(leave);
    setReviewDecision(decision);
    setReviewRemarks('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    try {
      await api.put(`/leaves/${reviewLeave._id}/status`, {
        status: reviewDecision,
        reviewRemarks
      });
      setReviewModalOpen(false);
      fetchAllLeaves();
      fetchMyLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update leave status');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Apply Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-sm text-slate-500">Apply for time off, check quota balances, and review team requests</p>
        </div>
        <button
          onClick={() => {
            setApplyError('');
            setIsApplyModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Casual Leave (CL)</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{balances.casual ?? 12} days</h3>
            <span className="text-xs text-slate-500">Available quota</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            CL
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Sick Leave (SL)</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{balances.sick ?? 10} days</h3>
            <span className="text-xs text-slate-500">Available quota</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            SL
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Paid / Earned Leave</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{balances.paid ?? 15} days</h3>
            <span className="text-xs text-slate-500">Available quota</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            PL
          </div>
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
            Staff Leave Requests {stats.pending > 0 && `(${stats.pending} pending)`}
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
          My Applications
        </button>
      </div>

      {/* TAB 1: ALL LEAVES (Admin/Manager) */}
      {activeTab === 'all' && isAdminOrManager && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            {['', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setAllStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  allStatus === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status || 'All Requests'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allLeaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{l.employee?.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {l.employee?.employeeId} • {l.employee?.department?.name || 'General'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{l.leaveType}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(l.startDate, 'dd MMM')} - {formatDate(l.endDate, 'dd MMM yyyy')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{l.totalDays} day(s)</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(l.status)}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {l.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openReviewModal(l, 'Approved')}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openReviewModal(l, 'Rejected')}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Reviewed by {l.reviewedBy?.name || 'HR'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MY LEAVES */}
      {activeTab === 'my' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Total Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myLeaves.map((l) => (
                <tr key={l._id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-800">{l.leaveType}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {formatDate(l.startDate, 'dd MMM yyyy')} to {formatDate(l.endDate, 'dd MMM yyyy')}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{l.totalDays} day(s)</td>
                  <td className="py-3 px-4 text-slate-600">{l.reason}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(l.status)}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 italic">{l.reviewRemarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Time Off"
      >
        {applyError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {applyError}
          </div>
        )}

        <form onSubmit={handleApplySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type *</label>
            <select
              value={applyForm.leaveType}
              onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="Casual">Casual Leave (Available: {balances.casual})</option>
              <option value="Sick">Sick Leave (Available: {balances.sick})</option>
              <option value="Paid">Paid / Annual Leave (Available: {balances.paid})</option>
              <option value="Unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={applyForm.startDate}
                onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={applyForm.endDate}
                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave *</label>
            <textarea
              required
              rows="3"
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
              placeholder="State reason clearly..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applySubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl shadow-md"
            >
              {applySubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`${reviewDecision} Leave Request`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            You are about to <span className="font-bold">{reviewDecision.toLowerCase()}</span> leave for{' '}
            <span className="font-bold text-slate-900">{reviewLeave?.employee?.name}</span> ({reviewLeave?.totalDays} days).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Note (Optional)</label>
            <input
              type="text"
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              placeholder="e.g. Approved as discussed"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewSubmitting}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md ${
                reviewDecision === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {reviewSubmitting ? 'Saving...' : `Confirm ${reviewDecision}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveList;
