const inventoryService = require('../services/inventoryService');

/**
 * @desc    Get inventory items across all warehouses with filtering
 * @route   GET /api/inventory
 * @access  Private (Authenticated users)
 */
const getAllInventory = async (req, res, next) => {
  try {
    const { status, warehouseId } = req.query;
    const inventory = await inventoryService.getAllInventory({ status, warehouseId });

    return res.status(200).json({
      success: true,
      message: 'Inventory retrieved successfully',
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get inventory for specific product
 * @route   GET /api/inventory/:productId
 * @access  Private (Authenticated users)
 */
const getInventoryByProductId = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const inventoryItem = await inventoryService.getInventoryByProductId(productId);

    return res.status(200).json({
      success: true,
      message: 'Inventory item retrieved successfully',
      data: inventoryItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Adjust inventory quantity safely
 * @route   PATCH /api/inventory/:productId/adjust
 * @access  Private (Manager & Staff)
 */
const adjustInventory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const result = await inventoryService.adjustInventory(productId, req.body, req.user);

    return res.status(200).json({
      success: true,
      message: 'Inventory adjusted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all low stock and out of stock items
 * @route   GET /api/inventory/low-stock
 * @access  Private (Authenticated users)
 */
const getLowStock = async (req, res, next) => {
  try {
    const lowStockItems = await inventoryService.getLowStockItems();

    return res.status(200).json({
      success: true,
      message: 'Low-stock items retrieved successfully',
      data: lowStockItems,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllInventory,
  getInventoryByProductId,
  adjustInventory,
  getLowStock,
};
