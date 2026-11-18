const express = require('express');
const router = express.Router();
const {
  generatePayroll,
  getPayrolls,
  getMyPayrolls,
  getPayrollById,
  updatePayrollStatus
} = require('../controllers/payrollController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/my', getMyPayrolls);
router.get('/:id', getPayrollById);

router.get('/', authorize('admin', 'manager'), getPayrolls);
router.post('/generate', authorize('admin'), generatePayroll);
router.put('/:id/status', authorize('admin'), updatePayrollStatus);

module.exports = router;
