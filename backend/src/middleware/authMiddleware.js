const authService = require('../services/authService');

/**
 * Authentication Middleware
 * Validates Supabase Bearer access token from Authorization header
 * and attaches verified user profile & role to req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Verify token with Supabase Auth and fetch user details & role
    try {
      const user = await authService.getAuthenticatedUser(token);
      req.user = user;
      next();
    } catch (authErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
};

module.exports = authMiddleware;
