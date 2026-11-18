const Announcement = require('../models/Announcement');

// @desc    Get announcements visible to the current user
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res, next) => {
  try {
    const userDept = req.user.department;

    // Admin sees all announcements, employees see global announcements or those targeted to their department
    const query = { isActive: true };

    if (req.user.role !== 'admin') {
      query.$or = [{ targetDepartment: null }, { targetDepartment: userDept }];
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email avatar')
      .populate('targetDepartment', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      announcements
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Private (Admin, Manager)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, priority, targetDepartment } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      priority: priority || 'Medium',
      targetDepartment: targetDepartment || null,
      createdBy: req.user._id
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name email avatar')
      .populate('targetDepartment', 'name code');

    res.status(201).json({
      success: true,
      message: 'Announcement posted successfully',
      announcement: populatedAnnouncement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin)
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Announcement removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
};
