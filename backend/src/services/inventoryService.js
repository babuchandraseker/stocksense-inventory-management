const productService = require('./productService');
const supabase = require('../config/supabase');

class InventoryService {
  /**
   * Helper: Compute standardized inventory status
   */
  computeStatus(quantity, reorderLevel) {
    if (quantity <= 0) {
      return 'OUT_OF_STOCK';
    }
    if (quantity <= reorderLevel) {
      return 'LOW_STOCK';
    }
    return 'IN_STOCK';
  }

  /**
   * Helper: Map product entity to standardized inventory item response
   */
  mapToInventoryItem(product) {
    const quantity = Number(product.currentStock || 0);
    const reorderLevel = Number(product.reorderLevel || 10);
    const status = this.computeStatus(quantity, reorderLevel);

    return {
      id: `inv-${product.id}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      quantity,
      currentStock: quantity,
      reorderLevel,
      warehouseId: product.warehouseId,
      warehouseName: product.warehouseName,
      status,
      lastUpdated: product.lastUpdated,
    };
  }

  /**
   * GET /api/inventory
   */
  async getAllInventory(filters = {}) {
    const products = await productService.getAllProducts(filters);
    let items = products.map((p) => this.mapToInventoryItem(p));

    if (filters.status && filters.status !== 'All') {
      items = items.filter(
        (i) => i.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    if (filters.warehouseId && filters.warehouseId !== 'All') {
      items = items.filter((i) => i.warehouseId === filters.warehouseId);
    }

    return items;
  }

  /**
   * GET /api/inventory/:productId
   */
  async getInventoryByProductId(productId) {
    const product = await productService.getProductById(productId);
    if (!product) {
      const err = new Error(`Inventory item for product '${productId}' not found`);
      err.statusCode = 404;
      throw err;
    }
    return this.mapToInventoryItem(product);
  }

  /**
   * PATCH /api/inventory/:productId/adjust
   * Safely adjust inventory quantity with negative stock prevention
   */
  async adjustInventory(productId, adjustmentData, user) {
    const product = await productService.getProductById(productId);
    if (!product) {
      const err = new Error(`Product '${productId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    const {
      quantity,
      difference,
      countedQuantity,
      adjustmentType,
      reason = 'Cycle Count',
      notes = '',
    } = adjustmentData;

    let delta = 0;

    if (quantity !== undefined && quantity !== null) {
      const numQty = Number(quantity);
      if (isNaN(numQty) || !isFinite(numQty)) {
        const err = new Error('Quantity adjustment must be a valid finite number');
        err.statusCode = 400;
        throw err;
      }
      // If adjustmentType is set to 'set' or absolute, calculate delta
      if (adjustmentType === 'set') {
        delta = numQty - product.currentStock;
      } else {
        delta = numQty;
      }
    } else if (difference !== undefined && difference !== null) {
      const numDiff = Number(difference);
      if (isNaN(numDiff) || !isFinite(numDiff)) {
        const err = new Error('Difference must be a valid finite number');
        err.statusCode = 400;
        throw err;
      }
      delta = numDiff;
    } else if (countedQuantity !== undefined && countedQuantity !== null) {
      const numCounted = Number(countedQuantity);
      if (isNaN(numCounted) || !isFinite(numCounted) || numCounted < 0) {
        const err = new Error('Counted quantity must be a non-negative number');
        err.statusCode = 400;
        throw err;
      }
      delta = numCounted - product.currentStock;
    } else {
      const err = new Error(
        'Adjustment parameter required: supply quantity, difference, or countedQuantity'
      );
      err.statusCode = 400;
      throw err;
    }

    const currentStock = product.currentStock;
    const newStock = currentStock + delta;

    // RULE 1: Stock cannot become negative
    if (newStock < 0) {
      const err = new Error(
        `Inventory adjustment rejected: Stock cannot become negative. Current stock is ${currentStock}, adjustment is ${delta}, resulting in ${newStock}.`
      );
      err.statusCode = 400;
      throw err;
    }

    // Update product stock in product service / database
    const updatedProduct = await productService.updateProduct(product.id, {
      currentStock: newStock,
    });

    // Record adjustment in Supabase / audit log if supported
    try {
      await supabase.from('stock_adjustments').insert([
        {
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          warehouse_id: product.warehouseId,
          previous_quantity: currentStock,
          adjustment_delta: delta,
          new_quantity: newStock,
          reason,
          notes,
          adjusted_by: user?.id || null,
        },
      ]);
    } catch (_err) {
      // Continue if audit table is not active
    }

    const inventoryItem = this.mapToInventoryItem(updatedProduct);
    return {
      ...inventoryItem,
      previousStock: currentStock,
      adjustmentDelta: delta,
      reason,
      adjustedBy: user?.email || user?.id || 'system',
    };
  }

  /**
   * GET /api/inventory/low-stock
   * Returns all items where stock <= reorder level
   */
  async getLowStockItems() {
    const allItems = await this.getAllInventory();
    return allItems.filter(
      (item) => item.quantity <= item.reorderLevel
    );
  }
}

module.exports = new InventoryService();
