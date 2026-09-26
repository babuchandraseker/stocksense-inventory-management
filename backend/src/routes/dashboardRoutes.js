const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getDashboardSummary,
  getStockStatus,
  getRecentActivity,
} = require('../controllers/dashboardController');

const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(authMiddleware);

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get dashboard executive summary & KPIs
 * @access  Private (Manager & Staff)
 */
router.get('/summary', getDashboardSummary);

/**
 * @route   GET /api/dashboard/stock-status
 * @desc    Get stock status breakdown (In Stock, Low Stock, Out of Stock)
 * @access  Private (Manager & Staff)
 */
router.get('/stock-status', getStockStatus);

/**
 * @route   GET /api/dashboard/recent-activity
 * @desc    Get recent operational activity and movements
 * @access  Private (Manager & Staff)
 */
router.get('/recent-activity', getRecentActivity);

module.exports = router;
