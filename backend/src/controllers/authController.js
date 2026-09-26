/**
 * Auth Controller
 * Handles user authentication & profile requests.
 */

/**
 * @desc    Get current authenticated user info
 * @route   GET /api/auth/me
 * @access  Private (Authenticated users)
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Authenticated user',
      data: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        ...(req.user.name && { name: req.user.name }),
        ...(req.user.warehouseId && { warehouseId: req.user.warehouseId }),
        ...(req.user.warehouseName && { warehouseName: req.user.warehouseName }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Temporary test endpoint to verify authentication
 * @route   GET /api/auth/test
 * @access  Private (Authenticated users)
 */
const testAuth = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: {
        userId: req.user.id,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Temporary test endpoint to verify manager-only authorization
 * @route   GET /api/auth/test/manager
 * @access  Private (Manager only)
 */
const testManagerOnly = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Manager role authorized',
      data: {
        userId: req.user.id,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Temporary test endpoint to verify staff-only authorization
 * @route   GET /api/auth/test/staff
 * @access  Private (Staff only)
 */
const testStaffOnly = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Staff role authorized',
      data: {
        userId: req.user.id,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  testAuth,
  testManagerOnly,
  testStaffOnly,
};
