const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getDashboardSummary,
  getStockSummary,
  getLocationSummary,
  getRecentActivity,
} = require('../controllers/dashboardController');

const router = express.Router();

router.use(authMiddleware);

router.get('/summary', getDashboardSummary);
router.get('/manager-stats', getDashboardSummary);
router.get('/stock-summary', getStockSummary);
router.get('/stock-status', getStockSummary);
router.get('/location-summary', getLocationSummary);
router.get('/recent-activity', getRecentActivity);

module.exports = router;
