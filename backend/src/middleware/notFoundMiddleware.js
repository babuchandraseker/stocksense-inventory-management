/**
 * 404 Not Found Middleware
 * Handles all requests that do not match any defined route.
 */
const notFoundMiddleware = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};

module.exports = notFoundMiddleware;
