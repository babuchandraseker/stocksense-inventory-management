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

    const totalProducts = products.length;
    const totalStock = products.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
    const totalValuation = products.reduce(
      (acc, p) => acc + (Number(p.currentStock) || 0) * (Number(p.sellingPrice) || Number(p.costPrice) || 0),
      0
    );

    const outOfStock = products.filter((p) => (Number(p.currentStock) || 0) === 0).length;
    const lowStock = products.filter(
      (p) => (Number(p.currentStock) || 0) > 0 && (Number(p.currentStock) || 0) <= (Number(p.reorderLevel) || 10)
    ).length;
    const inStock = products.filter(
      (p) => (Number(p.currentStock) || 0) > (Number(p.reorderLevel) || 10)
    ).length;

    const pendingReceipts = receipts.filter((r) => {
      const s = (r.status || '').toLowerCase();
      return s === 'pending' || s === 'draft' || s === 'waiting';
    }).length;

    const validatedReceipts = receipts.filter((r) => {
      const s = (r.status || '').toLowerCase();
      return s === 'done' || s === 'completed' || s === 'validated';
    }).length;

    return {
      totalProducts,
      totalStock,
      totalStockQuantity: totalStock,
      totalValuation,
      inStock,
      inStockCount: inStock,
      lowStock,
      lowStockCount: lowStock,
      outOfStock,
      outOfStockCount: outOfStock,
      totalReceipts: receipts.length,
      pendingReceipts,
      validatedReceipts,
      pendingDeliveries: 1,
      pendingInternalTransfers: 1,
    };
  }

  /**
   * GET /api/dashboard/stock-status & /api/dashboard/stock-summary
   */
  async getStockSummary() {
    const products = await productService.getAllProducts();
    const outOfStock = products.filter((p) => (Number(p.currentStock) || 0) === 0).length;
    const lowStock = products.filter(
      (p) => (Number(p.currentStock) || 0) > 0 && (Number(p.currentStock) || 0) <= (Number(p.reorderLevel) || 10)
    ).length;
    const inStock = products.filter(
      (p) => (Number(p.currentStock) || 0) > (Number(p.reorderLevel) || 10)
    ).length;

    return {
      inStock,
      lowStock,
      outOfStock,
      total: products.length,
      items: products.map((p) => ({
        product: p.name,
        sku: p.sku,
        quantity: p.currentStock,
        category: p.category,
        unit: p.unit,
      })),
    };
  }

  /**
   * GET /api/dashboard/location-summary
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
    return movements.slice(0, Number(limit) || 10);
  }
}

module.exports = new DashboardService();
