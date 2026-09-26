const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAlerts,
  getAlertSummary,
} = require('../controllers/alertController');

const router = express.Router();

// Apply authentication middleware to all alert routes
router.use(authMiddleware);

/**
 * @route   GET /api/alerts
 * @desc    Get dynamic low-stock and out-of-stock alerts
 * @access  Private (Manager & Staff)
 */
router.get('/', getAlerts);

/**
 * @route   GET /api/alerts/summary
 * @desc    Get alert summary counts
 * @access  Private (Manager & Staff)
 */
router.get('/summary', getAlertSummary);

module.exports = router;
