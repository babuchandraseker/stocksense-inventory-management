const productService = require('./productService');
const inventoryService = require('./inventoryService');
const receiptService = require('./receiptService');
const stockMovementService = require('./stockMovementService');

class DashboardService {
  /**
   * GET /api/dashboard/summary
   * Real-time KPI aggregation across products, inventory, receipts, and movements
   */
  async getDashboardSummary() {
    const products = await productService.getAllProducts();
    const inventory = await inventoryService.getAllInventory();
    const receipts = await receiptService.getAllReceipts();

    const totalProducts = products.length;
    const totalInventoryItems = inventory.length;
    const totalStockQuantity = products.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
    const totalValuation = products.reduce(
      (acc, p) => acc + (Number(p.currentStock) || 0) * (Number(p.sellingPrice) || Number(p.costPrice) || 0),
      0
    );

    const outOfStockCount = inventory.filter((i) => i.status === 'OUT_OF_STOCK').length;
    const lowStockCount = inventory.filter((i) => i.status === 'LOW_STOCK').length;
    const inStockCount = inventory.filter((i) => i.status === 'IN_STOCK').length;

    const pendingReceipts = receipts.filter((r) => {
      const s = (r.status || '').toLowerCase();
      return s === 'pending' || s === 'draft' || s === 'waiting';
    }).length;

    const validatedReceipts = receipts.filter((r) => {
      const s = (r.status || '').toLowerCase();
      return s === 'confirmed' || s === 'validated';
    }).length;

    return {
      totalProducts,
      totalInventoryItems,
      totalStockQuantity,
      totalValuation,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalReceipts: receipts.length,
      pendingReceipts,
      validatedReceipts,
    };
  }

  /**
   * GET /api/dashboard/stock-status
   * Inventory breakdown by computed stock status
   */
  async getStockStatus() {
    const inventory = await inventoryService.getAllInventory();

    const inStock = inventory.filter((i) => i.status === 'IN_STOCK').length;
    const lowStock = inventory.filter((i) => i.status === 'LOW_STOCK').length;
    const outOfStock = inventory.filter((i) => i.status === 'OUT_OF_STOCK').length;

    return {
      inStock,
      lowStock,
      outOfStock,
      total: inventory.length,
    };
  }

  /**
   * GET /api/dashboard/recent-activity
   * Fetches latest operational audit trails & stock movements
   */
  async getRecentActivity(limit = 10) {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const movements = await stockMovementService.getAllMovements();

    // Map movements to standardized activity format
    const activities = movements.slice(0, safeLimit).map((m) => ({
      id: m.id,
      type: m.transactionType || m.movementType || 'STOCK_MOVEMENT',
      movementType: m.movementType || 'STOCK_IN',
      productId: m.productId,
      productName: m.productName,
      sku: m.sku,
      warehouseId: m.warehouseId,
      warehouseName: m.warehouseName,
      quantity: m.quantity,
      reference: m.reference,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      user: m.createdBy,
      timestamp: m.date,
    }));

    return activities;
  }
}

module.exports = new DashboardService();
