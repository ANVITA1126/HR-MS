const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    month: {
      type: String, // e.g. "January", "February" or "2025-01"
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    basicSalary: {
      type: Number,
      required: true,
      default: 0
    },
    allowances: {
      hra: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      special: { type: Number, default: 0 }
    },
    deductions: {
      providentFund: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    totalEarnings: {
      type: Number,
      required: true,
      default: 0
    },
    totalDeductions: {
      type: Number,
      required: true,
      default: 0
    },
    netSalary: {
      type: Number,
      required: true,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Processed', 'Paid'],
      default: 'Pending'
    },
    paymentDate: {
      type: Date
    },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'Cheque', 'Cash'],
      default: 'Bank Transfer'
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate payroll for the same employee, month, and year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
