const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

// Apply authentication middleware to all product routes
router.use(authMiddleware);

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Private (Manager & Staff)
 */
router.get('/', getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get product details by ID
 * @access  Private (Manager & Staff)
 */
router.get('/:id', getProductById);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Manager only)
 */
router.post('/', requireRole(ROLES.MANAGER), createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update an existing product
 * @access  Private (Manager only)
 */
router.put('/:id', requireRole(ROLES.MANAGER), updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private (Manager only)
 */
router.delete('/:id', requireRole(ROLES.MANAGER), deleteProduct);

module.exports = router;
