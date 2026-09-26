/**
 * Role Authorization Middleware
 * Enforces role-based access control (RBAC) on protected routes.
 * 
 * Usage:
 * router.get('/admin-only', authMiddleware, requireRole('manager'), controller);
 * router.get('/staff-or-manager', authMiddleware, requireRole('manager', 'staff'), controller);
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;

    // Check if user's role is in the list of allowed roles
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
};
