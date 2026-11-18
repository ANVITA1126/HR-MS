const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Helper to get today's date formatted as YYYY-MM-DD
const getTodayDateString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// @desc    Check-in for today
// @route   POST /api/attendance/check-in
// @access  Private
const checkIn = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const userId = req.user._id;

    let record = await Attendance.findOne({ employee: userId, date: today });

    if (record && record.checkIn) {
      return res.status(400).json({ success: false, message: 'You have already checked in today' });
    }

    const now = new Date();
    // Consider late if after 9:30 AM
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
    const initialStatus = isLate ? 'Late' : 'Present';

    if (!record) {
      record = await Attendance.create({
        employee: userId,
        date: today,
        checkIn: now,
        status: initialStatus
      });
    } else {
      record.checkIn = now;
      record.status = initialStatus;
      await record.save();
    }

    res.status(200).json({
      success: true,
      message: `Checked in successfully${isLate ? ' (Marked as Late)' : ''}`,
      attendance: record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-out for today
// @route   POST /api/attendance/check-out
// @access  Private
const checkOut = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const userId = req.user._id;

    const record = await Attendance.findOne({ employee: userId, date: today });

    if (!record || !record.checkIn) {
      return res.status(400).json({ success: false, message: 'You must check in first before checking out' });
    }

    if (record.checkOut) {
      return res.status(400).json({ success: false, message: 'You have already checked out today' });
    }

    const now = new Date();
    record.checkOut = now;

    // Calculate duration in hours
    const durationMs = record.checkOut.getTime() - record.checkIn.getTime();
    const durationHours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));
    record.totalHours = durationHours;

    // Adjust status if total hours is low
    if (durationHours < 4 && record.status !== 'Late') {
      record.status = 'Half-Day';
    }

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      attendance: record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's today attendance status
// @route   GET /api/attendance/today
// @access  Private
const getTodayStatus = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const record = await Attendance.findOne({ employee: req.user._id, date: today });

    res.status(200).json({
      success: true,
      attendance: record || null,
      isCheckedIn: !!(record && record.checkIn),
      isCheckedOut: !!(record && record.checkOut)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current employee's monthly attendance
// @route   GET /api/attendance/my
// @access  Private
const getMyAttendance = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const query = { employee: req.user._id };

    if (month && year) {
      const monthPadded = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${monthPadded}` };
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    // Summary calculation
    const summary = {
      totalDays: records.length,
      present: records.filter((r) => r.status === 'Present').length,
      late: records.filter((r) => r.status === 'Late').length,
      halfDay: records.filter((r) => r.status === 'Half-Day').length,
      absent: records.filter((r) => r.status === 'Absent').length,
      totalHours: records.reduce((acc, curr) => acc + (curr.totalHours || 0), 0).toFixed(1)
    };

    res.status(200).json({
      success: true,
      records,
      summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendance records (Admin / Manager)
// @route   GET /api/attendance
// @access  Private (Admin, Manager)
const getAllAttendance = async (req, res, next) => {
  try {
    const { date, department, status, employeeId, page = 1, limit = 50 } = req.query;

    const query = {};

    if (date) {
      query.date = date;
    }

    if (status) {
      query.status = status;
    }

    // Filter by employee or department
    let employeeFilter = {};
    if (department) {
      employeeFilter.department = department;
    }
    if (employeeId) {
      employeeFilter._id = employeeId;
    }

    if (department || employeeId) {
      const matchedUsers = await User.find(employeeFilter).select('_id');
      query.employee = { $in: matchedUsers.map((u) => u._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate({
          path: 'employee',
          select: 'name email employeeId avatar designation department',
          populate: { path: 'department', select: 'name code' }
        })
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      records,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin marks or edits attendance manually
// @route   POST /api/attendance/manual
// @access  Private (Admin, Manager)
const markAttendanceManual = async (req, res, next) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, totalHours, notes } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({ success: false, message: 'Please provide employeeId, date, and status' });
    }

    let record = await Attendance.findOne({ employee: employeeId, date });

    if (record) {
      record.status = status;
      if (checkIn) record.checkIn = checkIn;
      if (checkOut) record.checkOut = checkOut;
      if (totalHours !== undefined) record.totalHours = totalHours;
      if (notes) record.notes = notes;
      await record.save();
    } else {
      record = await Attendance.create({
        employee: employeeId,
        date,
        status,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        totalHours: totalHours || (status === 'Present' ? 8 : status === 'Half-Day' ? 4 : 0),
        notes: notes || 'Marked manually by admin'
      });
    }

    const populatedRecord = await Attendance.findById(record._id).populate('employee', 'name email employeeId');

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      attendance: populatedRecord
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance,
  markAttendanceManual
};
