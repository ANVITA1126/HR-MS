import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/formatters';
import {
  CreditCard,
  Plus,
  Printer,
  Eye,
  CheckCircle,
  FileText,
  Building,
  DollarSign
} from 'lucide-react';

const PayrollList = () => {
  const { user, isAdmin, isAdminOrManager } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState('');

  // Generate modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateMode, setGenerateMode] = useState('bulk'); // 'bulk' or 'single'
  const [employees, setEmployees] = useState([]);
  const [generateForm, setGenerateForm] = useState({
    employeeId: '',
    month: 'November',
    year: new Date().getFullYear(),
    remarks: ''
  });
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState('');

  // Payslip View Modal
  const [activeSlip, setActiveSlip] = useState(null);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const endpoint = isAdminOrManager ? '/payroll' : '/payroll/my';
      const params = {};
      if (selectedMonth) params.month = selectedMonth;
      if (selectedYear) params.year = selectedYear;
      if (selectedStatus) params.paymentStatus = selectedStatus;

      const res = await api.get(endpoint, { params });
      if (res.data.success) {
        setPayrolls(res.data.payrolls);
        if (res.data.summary) setSummary(res.data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/employees?limit=100');
      if (res.data.success) {
        setEmployees(res.data.employees);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, [selectedMonth, selectedYear, selectedStatus]);

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setGenerateMsg('');
    try {
      const payload = {
        month: generateForm.month,
        year: generateForm.year,
        remarks: generateForm.remarks
      };
      if (generateMode === 'single') {
        payload.employeeId = generateForm.employeeId;
      }

      const res = await api.post('/payroll/generate', payload);
      if (res.data.success) {
        setGenerateMsg(res.data.message);
        setTimeout(() => {
          setIsGenerateOpen(false);
          setGenerateMsg('');
          fetchPayrolls();
        }, 1500);
      }
    } catch (err) {
      setGenerateMsg(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/payroll/${id}/status`, { paymentStatus: status });
      fetchPayrolls();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update payment status');
    }
  };

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll & Salary Slips</h1>
          <p className="text-sm text-slate-500">Generate monthly compensation, issue payslips, and review disbursements</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Payroll</span>
          </button>
        )}
      </div>

      {/* Financial Overview (Admin/Manager) */}
      {isAdminOrManager && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Net Disbursement</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(summary.totalNetSalary)}</h3>
            <span className="text-xs text-slate-500">{summary.totalRecords} payslips issued</span>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Paid Out</span>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(summary.totalPaid)}</h3>
            <span className="text-xs text-slate-500">Transferred to accounts</span>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Pending Processing</span>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(summary.totalPending)}</h3>
            <span className="text-xs text-slate-500">Awaiting authorization</span>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-3">
        <div className="w-40">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="">All Months</option>
            {monthsList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="w-32">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
        </div>

        {isAdminOrManager && (
          <div className="w-36">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Processed">Processed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading payroll records...</div>
        ) : payrolls.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No payroll records found.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Basic Pay</th>
                <th className="py-3 px-4">Gross Earnings</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrolls.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{p.employee?.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {p.employee?.employeeId} • {p.employee?.designation}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {p.month} {p.year}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{formatCurrency(p.basicSalary)}</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">{formatCurrency(p.totalEarnings)}</td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">{formatCurrency(p.totalDeductions)}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(p.netSalary)}</td>
                  <td className="py-3 px-4">
                    {isAdmin ? (
                      <select
                        value={p.paymentStatus}
                        onChange={(e) => handleStatusChange(p._id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-0 cursor-pointer ${getStatusBadge(p.paymentStatus)}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processed">Processed</option>
                        <option value="Paid">Paid</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(p.paymentStatus)}`}>
                        {p.paymentStatus}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setActiveSlip(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Payroll Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Generate Monthly Payroll"
      >
        {generateMsg && (
          <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            {generateMsg}
          </div>
        )}

        <form onSubmit={handleGenerateSubmit} className="space-y-4">
          <div className="flex gap-4 p-2 bg-slate-50 rounded-xl">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="genMode"
                checked={generateMode === 'bulk'}
                onChange={() => setGenerateMode('bulk')}
                className="text-indigo-600"
              />
              Bulk (All Active Employees)
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="genMode"
                checked={generateMode === 'single'}
                onChange={() => setGenerateMode('single')}
                className="text-indigo-600"
              />
              Single Employee
            </label>
          </div>

          {generateMode === 'single' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee *</label>
              <select
                required
                value={generateForm.employeeId}
                onChange={(e) => setGenerateForm({ ...generateForm, employeeId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId} - Base: {formatCurrency(emp.salary)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Month *</label>
              <select
                value={generateForm.month}
                onChange={(e) => setGenerateForm({ ...generateForm, month: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                {monthsList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Year *</label>
              <input
                type="number"
                value={generateForm.year}
                onChange={(e) => setGenerateForm({ ...generateForm, year: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
            <input
              type="text"
              value={generateForm.remarks}
              onChange={(e) => setGenerateForm({ ...generateForm, remarks: e.target.value })}
              placeholder="e.g. Standard monthly cycle"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsGenerateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl shadow-md"
            >
              {generating ? 'Processing...' : 'Run Payroll Calculation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payslip View & Print Modal */}
      {activeSlip && (
        <Modal
          isOpen={!!activeSlip}
          onClose={() => setActiveSlip(null)}
          title={`Salary Slip - ${activeSlip.month} ${activeSlip.year}`}
          maxWidth="max-w-3xl"
        >
          <div id="printable-payslip" className="p-6 bg-white border border-slate-200 rounded-2xl text-slate-800 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-indigo-700">HR NEXUS ENTERPRISES</h2>
                <p className="text-xs text-slate-500">Corporate Tower, Tech Hub, Bengaluru, India</p>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  PAYSLIP FOR {activeSlip.month.toUpperCase()} {activeSlip.year}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(activeSlip.paymentStatus)}`}>
                  {activeSlip.paymentStatus}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Disbursed: {activeSlip.paymentDate ? formatDate(activeSlip.paymentDate) : 'Pending'}
                </p>
              </div>
            </div>

            {/* Employee details summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Employee Name</span>
                <span className="font-bold text-slate-900">{activeSlip.employee?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Employee ID</span>
                <span className="font-bold text-slate-900">{activeSlip.employee?.employeeId}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Department</span>
                <span className="font-bold text-slate-900">{activeSlip.employee?.department?.name || 'General'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Designation</span>
                <span className="font-bold text-slate-900">{activeSlip.employee?.designation}</span>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Earnings */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b">Earnings</div>
                <div className="divide-y divide-slate-100 p-2">
                  <div className="flex justify-between py-1.5 px-2">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-bold">{formatCurrency(activeSlip.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2">
                    <span className="text-slate-600">House Rent Allowance (HRA)</span>
                    <span className="font-bold">{formatCurrency(activeSlip.allowances?.hra)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2">
                    <span className="text-slate-600">Conveyance Allowance</span>
                    <span className="font-bold">{formatCurrency(activeSlip.allowances?.conveyance)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2">
                    <span className="text-slate-600">Medical Allowance</span>
                    <span className="font-bold">{formatCurrency(activeSlip.allowances?.medical)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2">
                    <span className="text-slate-600">Special Allowance</span>
                    <span className="font-bold">{formatCurrency(activeSlip.allowances?.special)}</span>
                  </div>
                  <div className="flex justify-between py-2 px-2 bg-emerald-50 text-emerald-800 font-bold border-t">
                    <span>Total Earnings</span>
                    <span>{formatCurrency(activeSlip.totalEarnings)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b">Deductions</div>
                <div className="divide-y divide-slate-100 p-2">
                  <div className="flex justify-between py-1.5 px-2">
                    <span className="text-slate-600">Provident Fund (PF)</span>
                    <span className="font-bold">{formatCurrency(activeSlip.deductions?.providentFund)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2">
                    <span className="text-slate-600">Professional / Income Tax</span>
                    <span className="font-bold">{formatCurrency(activeSlip.deductions?.tax)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2">
                    <span className="text-slate-600">Other Deductions</span>
                    <span className="font-bold">{formatCurrency(activeSlip.deductions?.other || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 px-2 bg-rose-50 text-rose-800 font-bold border-t">
                    <span>Total Deductions</span>
                    <span>{formatCurrency(activeSlip.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-indigo-500">Net Take-Home Pay</p>
                <p className="text-xs text-slate-500">Credited to registered bank account</p>
              </div>
              <div className="text-2xl font-black text-indigo-700">
                {formatCurrency(activeSlip.netSalary)}
              </div>
            </div>

            {/* Actions: Print */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Payslip</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PayrollList;
