const inventoryService = require('./inventoryService');

class AlertService {
  /**
   * Helper: Generate structured alert object from an inventory item
   */
  generateAlert(item) {
    const isOutOfStock = item.quantity <= 0;
    return {
      id: `alt-${item.productId}`,
      type: isOutOfStock ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      severity: isOutOfStock ? 'CRITICAL' : 'WARNING',
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouseName,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
      message: isOutOfStock
        ? `${item.productName} (${item.sku}) is out of stock!`
        : `${item.productName} (${item.sku}) stock is below reorder level (${item.quantity}/${item.reorderLevel} units remaining).`,
      timestamp: item.lastUpdated || new Date().toISOString(),
    };
  }

  /**
   * GET /api/alerts
   * Dynamically evaluates inventory data to generate real-time stock alerts
   */
  async getAlerts(filters = {}) {
    const { type, warehouseId } = filters;

    // Validate type filter if provided
    if (type && type !== 'ALL') {
      const upperType = type.toUpperCase();
      if (upperType !== 'LOW_STOCK' && upperType !== 'OUT_OF_STOCK') {
        const err = new Error("Invalid alert type. Allowed values: 'LOW_STOCK', 'OUT_OF_STOCK', 'ALL'");
        err.statusCode = 400;
        throw err;
      }
    }

    const lowStockItems = await inventoryService.getLowStockItems();
    let alerts = lowStockItems.map((item) => this.generateAlert(item));

    if (warehouseId && warehouseId !== 'All') {
      alerts = alerts.filter((a) => a.warehouseId === warehouseId);
    }

    if (type && type !== 'ALL') {
      const upperType = type.toUpperCase();
      alerts = alerts.filter((a) => a.type === upperType);
    }

    // Priority ordering: OUT_OF_STOCK (CRITICAL) first, then LOW_STOCK (WARNING)
    alerts.sort((a, b) => {
      if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
      if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
      return a.quantity - b.quantity; // Lowest stock first
    });

    return alerts;
  }

  /**
   * GET /api/alerts/summary
   * Returns aggregated alert counts
   */
  async getAlertSummary() {
    const alerts = await this.getAlerts();
    const outOfStockCount = alerts.filter((a) => a.type === 'OUT_OF_STOCK').length;
    const lowStockCount = alerts.filter((a) => a.type === 'LOW_STOCK').length;

    return {
      totalAlerts: alerts.length,
      outOfStock: outOfStockCount,
      lowStock: lowStockCount,
    };
  }
}

module.exports = new AlertService();
