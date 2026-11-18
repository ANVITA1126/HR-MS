const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getAnnouncements)
  .post(authorize('admin', 'manager'), createAnnouncement);

router
  .route('/:id')
  .delete(authorize('admin'), deleteAnnouncement);

module.exports = router;
