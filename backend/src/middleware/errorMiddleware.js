/**
 * Centralized Global Error Handling Middleware
 * Handles syntax errors, invalid input, custom application errors, and unhandled server exceptions.
 */
const errorMiddleware = (err, req, res, next) => {
  // Handle malformed JSON body errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload received',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  const message =
    statusCode === 500 && isProduction
      ? 'Internal server error'
      : err.message || 'Internal server error';

  const response = {
    success: false,
    message,
  };

  // Include stack traces only in development environment for debugging
  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  // Include error details object if explicitly provided
  if (err.details) {
    response.error = err.details;
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
