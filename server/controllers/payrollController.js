const Payroll = require('../models/Payroll');
const User = require('../models/User');

// Helper to calculate payroll figures based on basic salary
const calculateSalaryBreakdown = (baseSalary, customAllowances = {}, customDeductions = {}) => {
  const basic = Number(baseSalary) || 50000;

  // Standard industry breakdown percentages if not custom
  const hra = customAllowances.hra !== undefined ? Number(customAllowances.hra) : Math.round(basic * 0.4);
  const conveyance = customAllowances.conveyance !== undefined ? Number(customAllowances.conveyance) : 1600;
  const medical = customAllowances.medical !== undefined ? Number(customAllowances.medical) : 1250;
  const special = customAllowances.special !== undefined ? Number(customAllowances.special) : Math.round(basic * 0.1);

  const providentFund = customDeductions.providentFund !== undefined ? Number(customDeductions.providentFund) : Math.round(basic * 0.12);
  const tax = customDeductions.tax !== undefined ? Number(customDeductions.tax) : Math.round(basic * 0.05);
  const other = customDeductions.other !== undefined ? Number(customDeductions.other) : 0;

  const totalEarnings = basic + hra + conveyance + medical + special;
  const totalDeductions = providentFund + tax + other;
  const netSalary = Math.max(0, totalEarnings - totalDeductions);

  return {
    basicSalary: basic,
    allowances: { hra, conveyance, medical, special },
    deductions: { providentFund, tax, other },
    totalEarnings,
    totalDeductions,
    netSalary
  };
};

// @desc    Generate payroll (single employee or bulk for all active)
// @route   POST /api/payroll/generate
// @access  Private (Admin)
const generatePayroll = async (req, res, next) => {
  try {
    const { employeeId, month, year, allowances, deductions, remarks } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    // Single Employee Generation
    if (employeeId) {
      const employee = await User.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      // Check if already exists
      const existing = await Payroll.findOne({ employee: employeeId, month, year: Number(year) });
      if (existing) {
        return res.status(400).json({ success: false, message: `Payroll for ${month} ${year} already generated for this employee` });
      }

      const breakdown = calculateSalaryBreakdown(employee.salary, allowances, deductions);

      const payroll = await Payroll.create({
        employee: employee._id,
        month,
        year: Number(year),
        ...breakdown,
        remarks: remarks || `Monthly salary for ${month} ${year}`
      });

      const populatedPayroll = await Payroll.findById(payroll._id)
        .populate({
          path: 'employee',
          select: 'name email employeeId designation department bankDetails',
          populate: { path: 'department', select: 'name code' }
        });

      return res.status(201).json({
        success: true,
        message: 'Payroll generated successfully',
        payroll: populatedPayroll
      });
    }

    // Bulk Generation for all active employees
    const activeEmployees = await User.find({ status: 'Active' });
    const createdPayrolls = [];
    const skippedEmployees = [];

    for (const emp of activeEmployees) {
      const existing = await Payroll.findOne({ employee: emp._id, month, year: Number(year) });
      if (existing) {
        skippedEmployees.push(emp.name);
        continue;
      }

      const breakdown = calculateSalaryBreakdown(emp.salary);

      const payroll = await Payroll.create({
        employee: emp._id,
        month,
        year: Number(year),
        ...breakdown,
        remarks: `Bulk generated for ${month} ${year}`
      });

      createdPayrolls.push(payroll);
    }

    res.status(201).json({
      success: true,
      message: `Generated ${createdPayrolls.length} payroll records. ${skippedEmployees.length} skipped (already generated).`,
      count: createdPayrolls.length,
      skipped: skippedEmployees
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payroll records
// @route   GET /api/payroll
// @access  Private (Admin, Manager)
const getPayrolls = async (req, res, next) => {
  try {
    const { month, year, paymentStatus, department, page = 1, limit = 50 } = req.query;

    const query = {};

    if (month) query.month = month;
    if (year) query.year = Number(year);
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (department) {
      const usersInDept = await User.find({ department }).select('_id');
      query.employee = { $in: usersInDept.map((u) => u._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payrolls, total] = await Promise.all([
      Payroll.find(query)
        .populate({
          path: 'employee',
          select: 'name email employeeId designation department bankDetails avatar',
          populate: { path: 'department', select: 'name code' }
        })
        .sort({ year: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payroll.countDocuments(query)
    ]);

    // Financial totals
    const allMatching = await Payroll.find(query);
    const summary = {
      totalNetSalary: allMatching.reduce((acc, p) => acc + (p.netSalary || 0), 0),
      totalPaid: allMatching.filter((p) => p.paymentStatus === 'Paid').reduce((acc, p) => acc + (p.netSalary || 0), 0),
      totalPending: allMatching.filter((p) => p.paymentStatus === 'Pending').reduce((acc, p) => acc + (p.netSalary || 0), 0),
      totalRecords: total
    };

    res.status(200).json({
      success: true,
      payrolls,
      summary,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current employee's payslips
// @route   GET /api/payroll/my
// @access  Private
const getMyPayrolls = async (req, res, next) => {
  try {
    const payrolls = await Payroll.find({ employee: req.user._id })
      .populate({
        path: 'employee',
        select: 'name email employeeId designation department bankDetails',
        populate: { path: 'department', select: 'name code' }
      })
      .sort({ year: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      payrolls
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payslip by ID
// @route   GET /api/payroll/:id
// @access  Private
const getPayrollById = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate({
      path: 'employee',
      select: 'name email employeeId designation department bankDetails address phone',
      populate: { path: 'department', select: 'name code' }
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    // Only allow employee themselves or admin/manager to view
    if (
      req.user.role === 'employee' &&
      payroll.employee._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this payslip' });
    }

    res.status(200).json({
      success: true,
      payroll
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payroll payment status
// @route   PUT /api/payroll/:id/status
// @access  Private (Admin)
const updatePayrollStatus = async (req, res, next) => {
  try {
    const { paymentStatus, paymentMethod, paymentDate } = req.body;

    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    if (paymentStatus) payroll.paymentStatus = paymentStatus;
    if (paymentMethod) payroll.paymentMethod = paymentMethod;
    if (paymentStatus === 'Paid') {
      payroll.paymentDate = paymentDate || new Date();
    }

    await payroll.save();

    const populatedPayroll = await Payroll.findById(payroll._id).populate({
      path: 'employee',
      select: 'name email employeeId designation department bankDetails',
      populate: { path: 'department', select: 'name code' }
    });

    res.status(200).json({
      success: true,
      message: 'Payroll status updated successfully',
      payroll: populatedPayroll
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generatePayroll,
  getPayrolls,
  getMyPayrolls,
  getPayrollById,
  updatePayrollStatus
};
