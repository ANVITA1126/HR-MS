const express = require('express');
const router = express.Router();
const {
  getAdminDashboardStats,
  getEmployeeDashboardStats
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/admin', authorize('admin', 'manager'), getAdminDashboardStats);
router.get('/employee', getEmployeeDashboardStats);

module.exports = router;
