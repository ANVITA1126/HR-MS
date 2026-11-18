import { format, parseISO } from 'date-fns';

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString, formatStr = 'dd MMM yyyy') => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return format(date, formatStr);
  } catch {
    return dateString;
  }
};

export const formatTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'hh:mm a');
  } catch {
    return '-';
  }
};

export const getStatusBadge = (status) => {
  const map = {
    Active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    Present: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    Approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    Paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',

    Late: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    Pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    Processed: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    'Half-Day': 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20',

    Inactive: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
    Absent: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
    Rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
    'On Leave': 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20'
  };

  return map[status] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-400/20';
};
