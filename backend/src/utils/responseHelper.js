/**
 * Standardized API Response Helpers
 * Used across controllers to ensure consistent response format for StockSense APIs.
 */

const successResponse = (res, message = 'Request successful', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message = 'Something went wrong', error = {}, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
