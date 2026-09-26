const dashboardService = require('../services/dashboardService');

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

const getStockSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getStockSummary();
    return res.status(200).json({
      success: true,
      message: 'Stock status retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getLocationSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getLocationSummary();
    return res.status(200).json({
      success: true,
      message: 'Location summary retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

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
  getStockSummary,
  getLocationSummary,
  getRecentActivity,
};
