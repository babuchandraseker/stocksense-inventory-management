const stockMovementService = require('../services/stockMovementService');

/**
 * @desc    Get all stock movements / ledger entries
 * @route   GET /api/stock-movements
 * @access  Private (Manager & Staff)
 */
const getAllStockMovements = async (req, res, next) => {
  try {
    const { productId, type, warehouseId } = req.query;
    const movements = await stockMovementService.getAllMovements({ productId, type, warehouseId });

    return res.status(200).json({
      success: true,
      message: 'Stock movements retrieved successfully',
      data: movements,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get stock movement by ID
 * @route   GET /api/stock-movements/:id
 * @access  Private (Manager & Staff)
 */
const getStockMovementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movement = await stockMovementService.getMovementById(id);

    if (!movement) {
      return res.status(404).json({
        success: false,
        message: `Stock movement with ID '${id}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Stock movement retrieved successfully',
      data: movement,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStockMovements,
  getStockMovementById,
};
