const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: String, // Stored as YYYY-MM-DD for easy daily grouping
      required: true
    },
    checkIn: {
      type: Date
    },
    checkOut: {
      type: Date
    },
    totalHours: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Present', 'Late', 'Half-Day', 'Absent', 'On Leave'],
      default: 'Present'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Ensure an employee has at most one attendance record per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
