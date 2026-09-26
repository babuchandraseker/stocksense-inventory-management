const supabase = require('../config/supabase');

const INITIAL_LEDGER_ENTRIES = [
  {
    id: 'led-01',
    date: new Date().toISOString(),
    productId: 'prod-01',
    productName: 'iPhone 15',
    sku: 'IP15-128',
    warehouseId: 'wh-main',
    warehouseName: 'Central Logistics Hub',
    transactionType: 'RECEIPT',
    movementType: 'STOCK_IN',
    quantity: 10,
    reference: 'REC-1024',
    referenceType: 'RECEIPT',
    referenceId: 'rec-1024',
    createdBy: 'Admin',
    previousStock: 135,
    newStock: 145,
  },
  {
    id: 'led-02',
    date: new Date().toISOString(),
    productId: 'prod-02',
    productName: 'MacBook Air M2',
    sku: 'MBA-M2-256',
    warehouseId: 'wh-main',
    warehouseName: 'Central Logistics Hub',
    transactionType: 'RECEIPT',
    movementType: 'STOCK_IN',
    quantity: 5,
    reference: 'REC-1024',
    referenceType: 'RECEIPT',
    referenceId: 'rec-1024',
    createdBy: 'Admin',
    previousStock: 3,
    newStock: 8,
  },
];

class StockMovementService {
  constructor() {
    this.memoryMovements = [...INITIAL_LEDGER_ENTRIES];
  }

  isSupabaseConfigured() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    return !!(
      url &&
      key &&
      !url.includes('placeholder') &&
      !url.includes('your-project') &&
      !key.includes('placeholder') &&
      !key.includes('your_')
    );
  }

  normalizeMovement(m) {
    if (!m) return null;
    return {
      id: String(m.id),
      date: m.date || m.created_at || new Date().toISOString(),
      productId: m.productId || m.product_id,
      productName: m.productName || m.product_name,
      sku: m.sku || '',
      warehouseId: m.warehouseId || m.warehouse_id || 'wh-main',
      warehouseName: m.warehouseName || m.warehouse_name || 'Central Logistics Hub',
      transactionType: m.transactionType || m.transaction_type || m.movementType || m.movement_type || 'RECEIPT',
      movementType: m.movementType || m.movement_type || 'STOCK_IN',
      quantity: Number(m.quantity || 0),
      reference: m.reference || m.reference_number || '',
      referenceType: m.referenceType || m.reference_type || 'RECEIPT',
      referenceId: m.referenceId || m.reference_id || null,
      createdBy: m.createdBy || m.created_by || 'system',
      previousStock: m.previousStock !== undefined ? Number(m.previousStock) : (m.previous_stock !== undefined ? Number(m.previous_stock) : null),
      newStock: m.newStock !== undefined ? Number(m.newStock) : (m.new_stock !== undefined ? Number(m.new_stock) : null),
    };
  }

  /**
   * GET all stock movements with filtering
   */
  async getAllMovements(filters = {}) {
    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('stock_movements').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          let list = data.map((m) => this.normalizeMovement(m));
          if (filters.productId) {
            list = list.filter((m) => m.productId === filters.productId);
          }
          if (filters.type) {
            list = list.filter((m) => m.transactionType.toLowerCase() === filters.type.toLowerCase() || m.movementType.toLowerCase() === filters.type.toLowerCase());
          }
          if (filters.warehouseId) {
            list = list.filter((m) => m.warehouseId === filters.warehouseId);
          }
          return list;
        }
      } catch (_err) {
        // Fallback
      }
    }

    let list = this.memoryMovements.map((m) => this.normalizeMovement(m));
    if (filters.productId) {
      list = list.filter((m) => m.productId === filters.productId);
    }
    if (filters.type) {
      list = list.filter((m) => m.transactionType.toLowerCase() === filters.type.toLowerCase() || m.movementType.toLowerCase() === filters.type.toLowerCase());
    }
    if (filters.warehouseId) {
      list = list.filter((m) => m.warehouseId === filters.warehouseId);
    }
    return list;
  }

  /**
   * GET single stock movement by ID
   */
  async getMovementById(id) {
    if (!id) return null;

    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('stock_movements').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          return this.normalizeMovement(data);
        }
      } catch (_err) {
        // Fallback
      }
    }

    const found = this.memoryMovements.find((m) => m.id === id);
    return found ? this.normalizeMovement(found) : null;
  }

  /**
   * Record a new stock movement
   */
  async recordMovement(movementData) {
    const newMovement = {
      id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString(),
      productId: movementData.productId,
      productName: movementData.productName,
      sku: movementData.sku,
      warehouseId: movementData.warehouseId || 'wh-main',
      warehouseName: movementData.warehouseName || 'Central Logistics Hub',
      transactionType: movementData.transactionType || 'RECEIPT',
      movementType: movementData.movementType || 'STOCK_IN',
      quantity: Number(movementData.quantity),
      reference: movementData.reference || '',
      referenceType: movementData.referenceType || 'RECEIPT',
      referenceId: movementData.referenceId || null,
      createdBy: movementData.createdBy || 'system',
      previousStock: movementData.previousStock !== undefined ? Number(movementData.previousStock) : null,
      newStock: movementData.newStock !== undefined ? Number(movementData.newStock) : null,
    };

    if (this.isSupabaseConfigured()) {
      try {
        await supabase.from('stock_movements').insert([
          {
            id: newMovement.id,
            product_id: newMovement.productId,
            product_name: newMovement.productName,
            sku: newMovement.sku,
            warehouse_id: newMovement.warehouseId,
            warehouse_name: newMovement.warehouseName,
            transaction_type: newMovement.transactionType,
            movement_type: newMovement.movementType,
            quantity: newMovement.quantity,
            reference: newMovement.reference,
            reference_type: newMovement.referenceType,
            reference_id: newMovement.referenceId,
            created_by: newMovement.createdBy,
            previous_stock: newMovement.previousStock,
            new_stock: newMovement.newStock,
          },
        ]);
      } catch (_err) {
        // Fallback
      }
    }

    this.memoryMovements.unshift(newMovement);
    return newMovement;
  }
}

module.exports = new StockMovementService();
