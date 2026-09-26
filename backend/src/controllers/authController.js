const authService = require('../services/authService');

/**
 * Auth Controller
 * Handles user authentication, SMS OTP requests, verification & profile management.
 */

/**
 * @desc    Login with Email & Password
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const authResult = await authService.loginWithPassword(email, password);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: authResult,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid email or password',
    });
  }
};

/**
 * @desc    Send SMS OTP to phone number
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const result = await authService.sendOtp(phone);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to send OTP',
    });
  }
};

/**
 * @desc    Verify SMS OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { phone, token, otp } = req.body;
    const otpCode = token || otp;

    if (!phone || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP code are required',
      });
    }

    const authResult = await authService.verifyOtp(phone, otpCode);

    return res.status(200).json({
      success: true,
      message: 'OTP verification successful',
      data: authResult,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid or expired OTP',
    });
  }
};

/**
 * @desc    Get current authenticated user info
 * @route   GET /api/auth/me
 * @access  Private (Authenticated users)
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Authenticated user profile',
      data: {
        id: req.user.id,
        email: req.user.email,
        phone: req.user.phone,
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
 * @desc    Logout current user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Test endpoints
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
  login,
  sendOtp,
  verifyOtp,
  logout,
  getMe,
  testAuth,
  testManagerOnly,
  testStaffOnly,
};
