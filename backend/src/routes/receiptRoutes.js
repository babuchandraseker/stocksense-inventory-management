const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');
const {
  getAllReceipts,
  getReceiptById,
  createReceipt,
  validateReceipt,
} = require('../controllers/receiptController');

const router = express.Router();

// Apply auth middleware to all receipt routes
router.use(authMiddleware);

/**
 * @route   GET /api/receipts
 * @desc    Get all receipts
 * @access  Private (Manager & Staff)
 */
router.get('/', getAllReceipts);

/**
 * @route   GET /api/receipts/:id
 * @desc    Get receipt details with line items
 * @access  Private (Manager & Staff)
 */
router.get('/:id', getReceiptById);

/**
 * @route   POST /api/receipts
 * @desc    Create a new receipt
 * @access  Private (Manager & Staff)
 */
router.post('/', requireRole(ROLES.MANAGER, ROLES.STAFF), createReceipt);

/**
 * @route   POST /api/receipts/:id/validate
 * @desc    Validate a receipt and increase inventory
 * @access  Private (Manager & Staff)
 */
router.post('/:id/validate', requireRole(ROLES.MANAGER, ROLES.STAFF), validateReceipt);

module.exports = router;
