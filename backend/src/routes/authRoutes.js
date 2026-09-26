const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');
const {
  getMe,
  testAuth,
  testManagerOnly,
  testStaffOnly,
} = require('../controllers/authController');

const router = express.Router();

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
