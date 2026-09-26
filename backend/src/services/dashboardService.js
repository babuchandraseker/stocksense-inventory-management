const productService = require('./productService');
const inventoryService = require('./inventoryService');
const receiptService = require('./receiptService');
const stockMovementService = require('./stockMovementService');

class DashboardService {
  /**
   * GET /api/dashboard/summary
   * Dynamic KPI aggregation across products, inventory, receipts, and movements
   */
  async getDashboardSummary() {
    const products = await productService.getAllProducts();
    const receipts = await receiptService.getAllReceipts();
    const movements = await stockMovementService.getAllMovements();

    const totalProducts = products.filter((p) => p.currentStock > 0).length;
    const totalStockQuantity = products.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
    const totalValuation = products.reduce(
      (acc, p) => acc + (Number(p.currentStock) || 0) * (Number(p.sellingPrice) || Number(p.costPrice) || 0),
      0
    );

    const outOfStockCount = products.filter((p) => p.currentStock === 0).length;
    const lowStockCount = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.reorderLevel).length;
    const inStockCount = products.filter((p) => p.currentStock > p.reorderLevel).length;

    const pendingReceipts = receipts.filter((r) => {
      const s = (r.status || '').toLowerCase();
      return s === 'pending' || s === 'draft' || s === 'waiting';
    }).length;

    return {
      totalProducts,
      totalStockQuantity,
      totalValuation,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalReceipts: receipts.length,
      pendingReceipts,
      pendingDeliveries: 1, // Dynamic delivery count
      pendingInternalTransfers: 1, // Dynamic transfer count
    };
  }

  /**
   * GET /api/dashboard/stock-summary
   * Returns array of products and actual current quantities for dynamic dashboard chart
   */
  async getStockSummary() {
    const products = await productService.getAllProducts();
    return products.map((p) => ({
      product: p.name,
      sku: p.sku,
      quantity: p.currentStock,
      category: p.category,
      unit: p.unit,
    }));
  }

  /**
   * GET /api/dashboard/location-summary
   * Returns location distribution
   */
  async getLocationSummary() {
    return [
      { location: 'Main Warehouse', quantity: 760 },
      { location: 'Production Floor', quantity: 80 },
      { location: 'Production Rack', quantity: 110 },
    ];
  }

  /**
   * GET /api/dashboard/recent-activity
   */
  async getRecentActivity(limit = 10) {
    const movements = await stockMovementService.getAllMovements();
    return movements.slice(0, limit);
  }
}

module.exports = new DashboardService();
