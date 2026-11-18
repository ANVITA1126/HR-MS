const Leave = require('../models/Leave');
const User = require('../models/User');

// Helper to calculate business/calendar days
const calculateDays = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
    }

    const totalDays = calculateDays(startDate, endDate);

    // Check user leave balance
    const user = await User.findById(req.user._id);
    const typeKey = leaveType.toLowerCase();

    if (user.leaveBalance && user.leaveBalance[typeKey] !== undefined) {
      if (user.leaveBalance[typeKey] < totalDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} leave balance. Available: ${user.leaveBalance[typeKey]} day(s), Requested: ${totalDays} day(s)`
        });
      }
    }

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason
    });

    const populatedLeave = await Leave.findById(leave._id).populate('employee', 'name email employeeId avatar');

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave: populatedLeave
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's leaves
// @route   GET /api/leaves/my
// @access  Private
const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    const user = await User.findById(req.user._id).select('leaveBalance');

    res.status(200).json({
      success: true,
      leaves,
      leaveBalance: user ? user.leaveBalance : {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all leave applications (Admin / Manager)
// @route   GET /api/leaves
// @access  Private (Admin, Manager)
const getAllLeaves = async (req, res, next) => {
  try {
    const { status, leaveType, department, page = 1, limit = 50 } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (leaveType) {
      query.leaveType = leaveType;
    }

    if (department) {
      const usersInDept = await User.find({ department }).select('_id');
      query.employee = { $in: usersInDept.map((u) => u._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [leaves, total] = await Promise.all([
      Leave.find(query)
        .populate({
          path: 'employee',
          select: 'name email employeeId avatar designation department leaveBalance',
          populate: { path: 'department', select: 'name code' }
        })
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Leave.countDocuments(query)
    ]);

    // Statistics overview
    const stats = {
      pending: await Leave.countDocuments({ status: 'Pending' }),
      approved: await Leave.countDocuments({ status: 'Approved' }),
      rejected: await Leave.countDocuments({ status: 'Rejected' })
    };

    res.status(200).json({
      success: true,
      leaves,
      stats,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject leave application
// @route   PUT /api/leaves/:id/status
// @access  Private (Admin, Manager)
const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, reviewRemarks } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Approved or Rejected' });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave application not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Leave application is already ${leave.status}` });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewRemarks = reviewRemarks || '';
    leave.reviewedAt = new Date();

    // If approved, deduct leave balance
    if (status === 'Approved') {
      const user = await User.findById(leave.employee);
      const typeKey = leave.leaveType.toLowerCase();

      if (user && user.leaveBalance && user.leaveBalance[typeKey] !== undefined) {
        user.leaveBalance[typeKey] = Math.max(0, user.leaveBalance[typeKey] - leave.totalDays);
        await user.save();
      }
    }

    await leave.save();

    const populatedLeave = await Leave.findById(leave._id)
      .populate('employee', 'name email employeeId avatar leaveBalance')
      .populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Leave application ${status.toLowerCase()} successfully`,
      leave: populatedLeave
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus
};
