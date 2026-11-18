const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', applyLeave);
router.get('/my', getMyLeaves);

router.get('/', authorize('admin', 'manager'), getAllLeaves);
router.put('/:id/status', authorize('admin', 'manager'), updateLeaveStatus);

module.exports = router;
