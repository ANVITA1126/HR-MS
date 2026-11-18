const User = require('../models/User');
const Department = require('../models/Department');

// @desc    Get all employees with filter, search & pagination
// @route   GET /api/employees
// @access  Private (Admin, Manager, HR)
const getEmployees = async (req, res, next) => {
  try {
    const { search, department, role, status, page = 1, limit = 50 } = req.query;

    const query = {};

    // Search by name, email, employeeId, or designation
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [employees, total] = await Promise.all([
      User.find(query)
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      employees
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id).populate('department', 'name code head');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Admin, HR)
const createEmployee = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'employee',
      employeeId,
      department,
      designation,
      phone,
      gender,
      dateOfBirth,
      dateOfJoining,
      employmentType,
      salary,
      address,
      bankDetails,
      emergencyContact,
      status = 'Active'
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    let finalEmpId = employeeId;
    if (!finalEmpId) {
      const count = await User.countDocuments();
      finalEmpId = `EMP-${1000 + count + 1}`;
    } else {
      const existingId = await User.findOne({ employeeId: finalEmpId });
      if (existingId) {
        return res.status(400).json({ success: false, message: 'Employee ID already taken' });
      }
    }

    const employee = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || 'Welcome@123',
      role,
      employeeId: finalEmpId,
      department: department || null,
      designation: designation || 'Staff',
      phone: phone || '',
      gender: gender || 'Not Specified',
      dateOfBirth: dateOfBirth || null,
      dateOfJoining: dateOfJoining || new Date(),
      employmentType: employmentType || 'Full-Time',
      salary: salary ? Number(salary) : 50000,
      address: address || {},
      bankDetails: bankDetails || {},
      emergencyContact: emergencyContact || {},
      status
    });

    const populatedEmployee = await User.findById(employee._id).populate('department', 'name code');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: populatedEmployee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin, HR)
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Do not update password through this route
    if (req.body.password) {
      delete req.body.password;
    }

    // Check if email or employeeId conflict
    if (req.body.email && req.body.email.toLowerCase() !== employee.email) {
      const emailExists = await User.findOne({ email: req.body.email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    if (req.body.employeeId && req.body.employeeId !== employee.employeeId) {
      const idExists = await User.findOne({ employeeId: req.body.employeeId });
      if (idExists) {
        return res.status(400).json({ success: false, message: 'Employee ID already in use' });
      }
    }

    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('department', 'name code');

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedEmployee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin)
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Prevent deleting oneself
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar for employee
// @route   POST /api/employees/:id/avatar
// @access  Private
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const employee = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl,
      employee
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadAvatar
};
