/**
 * Health and Status Controller
 * Provides operational health and status endpoints for StockSense API.
 */

/**
 * @desc    Health check endpoint
 * @route   GET /api/health
 * @access  Public
 */
const getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'StockSense backend is healthy',
  });
};

/**
 * @desc    Service status endpoint
 * @route   GET /api/status
 * @access  Public
 */
const getStatus = (req, res) => {
  return res.status(200).json({
    success: true,
    service: 'StockSense Backend',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
  });
};

module.exports = {
  getHealth,
  getStatus,
};
