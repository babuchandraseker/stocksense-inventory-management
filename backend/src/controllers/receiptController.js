const receiptService = require('../services/receiptService');

/**
 * @desc    Get all receipts with optional filtering
 * @route   GET /api/receipts
 * @access  Private (Manager & Staff)
 */
const getAllReceipts = async (req, res, next) => {
  try {
    const { status, warehouseId } = req.query;
    const receipts = await receiptService.getAllReceipts({ status, warehouseId });

    return res.status(200).json({
      success: true,
      message: 'Receipts retrieved successfully',
      data: receipts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get receipt by ID with its items
 * @route   GET /api/receipts/:id
 * @access  Private (Manager & Staff)
 */
const getReceiptById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const receipt = await receiptService.getReceiptById(id);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: `Receipt with ID '${id}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Receipt retrieved successfully',
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new receipt
 * @route   POST /api/receipts
 * @access  Private (Manager & Staff)
 */
const createReceipt = async (req, res, next) => {
  try {
    const newReceipt = await receiptService.createReceipt(req.body, req.user);

    return res.status(201).json({
      success: true,
      message: 'Receipt created successfully',
      data: newReceipt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate a receipt and increase inventory
 * @route   POST /api/receipts/:id/validate
 * @access  Private (Manager & Staff)
 */
const validateReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await receiptService.validateReceipt(id, req.user);

    return res.status(200).json({
      success: true,
      message: 'Receipt validated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllReceipts,
  getReceiptById,
  createReceipt,
  validateReceipt,
};
