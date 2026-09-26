const productService = require('../services/productService');

/**
 * @desc    Get all products with optional filtering
 * @route   GET /api/products
 * @access  Private (Authenticated users)
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { category, search, status } = req.query;
    const products = await productService.getAllProducts({ category, search, status });

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get product by ID or SKU
 * @route   GET /api/products/:id
 * @access  Private (Authenticated users)
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID '${id}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: {
        ...product,
        inventory: {
          quantity: product.currentStock,
          reorderLevel: product.reorderLevel,
          status: product.status,
          warehouseId: product.warehouseId,
          warehouseName: product.warehouseName,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private (Manager only)
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, sku, price, sellingPrice, costPrice, currentStock, reorderLevel } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Product name is required and cannot be empty',
      });
    }

    if (!sku || typeof sku !== 'string' || sku.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Product SKU is required and cannot be empty',
      });
    }

    const effectivePrice = sellingPrice !== undefined ? sellingPrice : price;
    if (effectivePrice !== undefined && (isNaN(Number(effectivePrice)) || Number(effectivePrice) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Product price must be a non-negative number',
      });
    }

    if (costPrice !== undefined && (isNaN(Number(costPrice)) || Number(costPrice) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cost price must be a non-negative number',
      });
    }

    if (currentStock !== undefined && (isNaN(Number(currentStock)) || Number(currentStock) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Current stock must be a non-negative number',
      });
    }

    if (reorderLevel !== undefined && (isNaN(Number(reorderLevel)) || Number(reorderLevel) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Reorder level must be a non-negative number',
      });
    }

    const newProduct = await productService.createProduct(req.body, req.user);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update existing product
 * @route   PUT /api/products/:id
 * @access  Private (Manager only)
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sku, price, sellingPrice, costPrice, currentStock, reorderLevel } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Product name cannot be empty',
      });
    }

    if (sku !== undefined && (typeof sku !== 'string' || sku.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Product SKU cannot be empty',
      });
    }

    const effectivePrice = sellingPrice !== undefined ? sellingPrice : price;
    if (effectivePrice !== undefined && (isNaN(Number(effectivePrice)) || Number(effectivePrice) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Product price must be a non-negative number',
      });
    }

    if (costPrice !== undefined && (isNaN(Number(costPrice)) || Number(costPrice) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cost price must be a non-negative number',
      });
    }

    if (currentStock !== undefined && (isNaN(Number(currentStock)) || Number(currentStock) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Current stock must be a non-negative number',
      });
    }

    if (reorderLevel !== undefined && (isNaN(Number(reorderLevel)) || Number(reorderLevel) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Reorder level must be a non-negative number',
      });
    }

    const updated = await productService.updateProduct(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private (Manager only)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await productService.deleteProduct(id);

    return res.status(200).json({
      success: true,
      message: `Product '${result.name}' deleted successfully`,
      data: { id: result.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
