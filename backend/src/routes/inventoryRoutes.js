const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');
const {
  getAllInventory,
  getInventoryByProductId,
  adjustInventory,
  getLowStock,
} = require('../controllers/inventoryController');

const router = express.Router();

// Apply authentication middleware to all inventory routes
router.use(authMiddleware);

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory balances
 * @access  Private (Manager & Staff)
 */
router.get('/', getAllInventory);

/**
 * @route   GET /api/inventory/low-stock
 * @desc    Get all low-stock and out-of-stock items
 * @access  Private (Manager & Staff)
 */
router.get('/low-stock', getLowStock);

/**
 * @route   GET /api/inventory/:productId
 * @desc    Get inventory balance for a specific product
 * @access  Private (Manager & Staff)
 */
router.get('/:productId', getInventoryByProductId);

/**
 * @route   PATCH /api/inventory/:productId/adjust
 * @desc    Safely adjust stock level
 * @access  Private (Manager & Staff)
 */
router.patch('/:productId/adjust', requireRole(ROLES.MANAGER, ROLES.STAFF), adjustInventory);

module.exports = router;
