const Department = require('../models/Department');
const User = require('../models/User');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .populate('head', 'name email avatar')
      .sort({ name: 1 });

    // Attach dynamic employee count
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const count = await User.countDocuments({ department: dept._id });
        const obj = dept.toObject();
        obj.employeeCount = count;
        return obj;
      })
    );

    res.status(200).json({
      success: true,
      departments: departmentsWithCounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single department with its employees
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id).populate('head', 'name email avatar');

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const employees = await User.find({ department: department._id }).select('name email designation avatar employeeId status');

    const obj = department.toObject();
    obj.employees = employees;
    obj.employeeCount = employees.length;

    res.status(200).json({
      success: true,
      department: obj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (Admin)
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, head } = req.body;

    const existingDept = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingDept) {
      return res.status(400).json({ success: false, message: 'Department with this name already exists' });
    }

    const department = await Department.create({
      name,
      code: code ? code.toUpperCase() : name.substring(0, 3).toUpperCase(),
      description,
      head: head || null
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin)
const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('head', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      department: updatedDepartment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check if any employees belong to this department
    const employeeCount = await User.countDocuments({ department: department._id });
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. There are ${employeeCount} employee(s) assigned to it. Please reassign them first.`
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
