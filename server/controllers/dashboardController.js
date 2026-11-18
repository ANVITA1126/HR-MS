const User = require('../models/User');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Announcement = require('../models/Announcement');

// @desc    Get Admin / HR Dashboard Stats & Analytics
// @route   GET /api/dashboard/admin
// @access  Private (Admin, Manager)
const getAdminDashboardStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total counts
    const [
      totalEmployees,
      activeEmployees,
      totalDepartments,
      pendingLeaves,
      todayAttendanceRecords,
      recentAnnouncements,
      recentLeaves,
      recentEmployees
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'Active' }),
      Department.countDocuments(),
      Leave.countDocuments({ status: 'Pending' }),
      Attendance.find({ date: today }).populate('employee', 'name email avatar department'),
      Announcement.find({ isActive: true }).sort({ createdAt: -1 }).limit(5),
      Leave.find()
        .populate('employee', 'name email avatar designation')
        .sort({ createdAt: -1 })
        .limit(5),
      User.find()
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email employeeId designation department dateOfJoining avatar status')
    ]);

    // Attendance breakdown today
    const presentToday = todayAttendanceRecords.filter(r => r.status === 'Present').length;
    const lateToday = todayAttendanceRecords.filter(r => r.status === 'Late').length;
    const halfDayToday = todayAttendanceRecords.filter(r => r.status === 'Half-Day').length;
    const absentToday = Math.max(0, activeEmployees - todayAttendanceRecords.length);

    // Department Distribution
    const departments = await Department.find();
    const departmentDistribution = await Promise.all(
      departments.map(async (dept) => {
        const count = await User.countDocuments({ department: dept._id });
        return {
          id: dept._id,
          name: dept.name,
          code: dept.code,
          count
        };
      })
    );

    // 7-Day Attendance Trend
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayRecords = await Attendance.find({ date: dateStr });
      const present = dayRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;

      past7Days.push({
        date: dateStr,
        day: dayName,
        present,
        total: activeEmployees
      });
    }

    // Monthly payroll expenditure
    const currentYear = new Date().getFullYear();
    const latestPayrolls = await Payroll.find({ year: currentYear });
    const totalPayrollSpent = latestPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        activeEmployees,
        totalDepartments,
        pendingLeaves,
        presentToday,
        lateToday,
        halfDayToday,
        absentToday,
        attendanceRate: activeEmployees > 0 ? Math.round(((presentToday + lateToday) / activeEmployees) * 100) : 0,
        totalPayrollSpent
      },
      departmentDistribution,
      attendanceTrend: past7Days,
      todayAttendance: todayAttendanceRecords,
      recentAnnouncements,
      recentLeaves,
      recentEmployees
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Employee Personal Dashboard Stats
// @route   GET /api/dashboard/employee
// @access  Private
const getEmployeeDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();

    const [
      user,
      todayAttendance,
      monthAttendance,
      myLeaves,
      recentPayslip,
      announcements
    ] = await Promise.all([
      User.findById(userId).populate('department', 'name code'),
      Attendance.findOne({ employee: userId, date: today }),
      Attendance.find({
        employee: userId,
        date: { $regex: `^${currentYear}-${currentMonth}` }
      }),
      Leave.find({ employee: userId }).sort({ createdAt: -1 }).limit(5),
      Payroll.findOne({ employee: userId }).sort({ year: -1, createdAt: -1 }),
      Announcement.find({
        isActive: true,
        $or: [{ targetDepartment: null }, { targetDepartment: req.user.department }]
      })
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Calculate month hours
    const totalHoursMonth = monthAttendance.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
    const daysPresentMonth = monthAttendance.filter(r => r.status === 'Present' || r.status === 'Late').length;

    res.status(200).json({
      success: true,
      user,
      todayAttendance: {
        record: todayAttendance || null,
        isCheckedIn: !!(todayAttendance && todayAttendance.checkIn),
        isCheckedOut: !!(todayAttendance && todayAttendance.checkOut)
      },
      monthSummary: {
        daysPresent: daysPresentMonth,
        totalHours: parseFloat(totalHoursMonth.toFixed(1))
      },
      leaveBalance: user.leaveBalance,
      recentLeaves: myLeaves,
      recentPayslip,
      announcements
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboardStats,
  getEmployeeDashboardStats
};
