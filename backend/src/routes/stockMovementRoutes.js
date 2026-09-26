const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllStockMovements,
  getStockMovementById,
} = require('../controllers/stockMovementController');

const router = express.Router();

// Apply auth middleware to all stock movement routes
router.use(authMiddleware);

/**
 * @route   GET /api/stock-movements
 * @desc    Get all stock movements / ledger entries
 * @access  Private (Manager & Staff)
 */
router.get('/', getAllStockMovements);

/**
 * @route   GET /api/stock-movements/:id
 * @desc    Get stock movement by ID
 * @access  Private (Manager & Staff)
 */
router.get('/:id', getStockMovementById);

module.exports = router;
