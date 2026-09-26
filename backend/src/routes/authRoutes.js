const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');
const {
  login,
  sendOtp,
  verifyOtp,
  register,
  logout,
  getMe,
  testAuth,
  testManagerOnly,
  testStaffOnly,
} = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send SMS OTP to phone number
 * @access  Public
 */
router.post('/send-otp', sendOtp);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify SMS OTP code
 * @access  Public
 */
router.post('/verify-otp', verifyOtp);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user after OTP verification
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user session
 * @access  Private
 */
router.post('/logout', authMiddleware, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user
 * @access  Private
 */
router.get('/me', authMiddleware, getMe);

/**
 * @route   GET /api/auth/test
 * @desc    Test protected authentication endpoint
 * @access  Private
 */
router.get('/test', authMiddleware, testAuth);

/**
 * @route   GET /api/auth/test/manager
 * @desc    Test manager-only role authorization
 * @access  Private (Manager only)
 */
router.get('/test/manager', authMiddleware, requireRole(ROLES.MANAGER), testManagerOnly);

/**
 * @route   GET /api/auth/test/staff
 * @desc    Test staff-only role authorization
 * @access  Private (Staff only)
 */
router.get('/test/staff', authMiddleware, requireRole(ROLES.STAFF), testStaffOnly);

module.exports = router;
