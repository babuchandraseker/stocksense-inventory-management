const dashboardService = require('../services/dashboardService');

/**
 * @desc    Get dashboard executive summary & KPIs
 * @route   GET /api/dashboard/summary
 * @access  Private (Manager & Staff)
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDashboardSummary();

    return res.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get stock status breakdown (In Stock, Low Stock, Out of Stock)
 * @route   GET /api/dashboard/stock-status
 * @access  Private (Manager & Staff)
 */
const getStockStatus = async (req, res, next) => {
  try {
    const stockStatus = await dashboardService.getStockStatus();

    return res.status(200).json({
      success: true,
      message: 'Stock status retrieved successfully',
      data: stockStatus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent operational activities and movements
 * @route   GET /api/dashboard/recent-activity
 * @access  Private (Manager & Staff)
 */
const getRecentActivity = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const activities = await dashboardService.getRecentActivity(limit);

    return res.status(200).json({
      success: true,
      message: 'Recent activity retrieved successfully',
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getStockStatus,
  getRecentActivity,
};
