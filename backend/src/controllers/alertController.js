const alertService = require('../services/alertService');

/**
 * @desc    Get dynamic stock alerts (Out of Stock, Low Stock)
 * @route   GET /api/alerts
 * @access  Private (Manager & Staff)
 */
const getAlerts = async (req, res, next) => {
  try {
    const { type, warehouseId } = req.query;
    const alerts = await alertService.getAlerts({ type, warehouseId });

    return res.status(200).json({
      success: true,
      message: 'Stock alerts retrieved successfully',
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get alert summary counts
 * @route   GET /api/alerts/summary
 * @access  Private (Manager & Staff)
 */
const getAlertSummary = async (req, res, next) => {
  try {
    const summary = await alertService.getAlertSummary();

    return res.status(200).json({
      success: true,
      message: 'Alert summary retrieved successfully',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  getAlertSummary,
};
