const supabase = require('../config/supabase');

const INITIAL_MOVEMENTS = [
  {
    id: 'mov-01',
    date: '2026-09-26 08:00 AM',
    productId: 'prod-01',
    productName: 'Steel Rods',
    sku: 'STL-ROD-001',
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    transactionType: 'INITIAL_STOCK',
    quantity: 500,
    reference: 'INIT-STL-ROD',
    createdBy: 'Admin',
  },
  {
    id: 'mov-02',
    date: '2026-09-26 08:05 AM',
    productId: 'prod-02',
    productName: 'Steel',
    sku: 'STL-001',
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    transactionType: 'INITIAL_STOCK',
    quantity: 300,
    reference: 'INIT-STL',
    createdBy: 'Admin',
  },
  {
    id: 'mov-03',
    date: '2026-09-26 08:10 AM',
    productId: 'prod-03',
    productName: 'Chairs',
    sku: 'CHR-001',
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    transactionType: 'INITIAL_STOCK',
    quantity: 100,
    reference: 'INIT-CHR',
    createdBy: 'Admin',
  },
  {
    id: 'mov-04',
    date: '2026-09-26 08:15 AM',
    productId: 'prod-04',
    productName: 'Steel Frames',
    sku: 'STF-001',
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    transactionType: 'INITIAL_STOCK',
    quantity: 50,
    reference: 'INIT-STF',
    createdBy: 'Admin',
  },
  {
    id: 'mov-05',
    date: '2026-09-26 10:15 AM',
    productId: 'prod-01',
    productName: 'Steel Rods',
    sku: 'STL-ROD-001',
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    transactionType: 'RECEIPT',
    quantity: 100,
    reference: 'REC-1001',
    createdBy: 'Admin',
  },
  {
    id: 'mov-06',
    date: '2026-09-26 10:45 AM',
    productId: 'prod-02',
    productName: 'Steel',
    sku: 'STL-001',
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    transactionType: 'TRANSFER_OUT',
    quantity: -50,
    reference: 'TRF-1001',
    createdBy: 'Staff',
  },
  {
    id: 'mov-07',
    date: '2026-09-26 10:45 AM',
    productId: 'prod-02',
    productName: 'Steel',
    sku: 'STL-001',
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    transactionType: 'TRANSFER_IN',
    quantity: 50,
    reference: 'TRF-1001',
    createdBy: 'Staff',
  },
  {
    id: 'mov-08',
    date: '2026-09-26 11:20 AM',
    productId: 'prod-02',
    productName: 'Steel',
    sku: 'STL-001',
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    transactionType: 'ADJUSTMENT',
    quantity: -3,
    reference: 'ADJ-5001',
    createdBy: 'Admin',
  },
];

class StockMovementService {
  constructor() {
    this.memoryMovements = [...INITIAL_MOVEMENTS];
  }

  async getAllMovements(filters = {}) {
    let list = [...this.memoryMovements];
    if (filters.transactionType && filters.transactionType !== 'All') {
      list = list.filter((m) => m.transactionType === filters.transactionType);
    }
    return list;
  }

  async recordMovement(data) {
    const entry = {
      id: `mov-${Date.now()}`,
      date: new Date().toLocaleString(),
      productId: data.productId,
      productName: data.productName,
      sku: data.sku,
      warehouseId: data.warehouseId || 'wh-main',
      warehouseName: data.warehouseName || 'Main Warehouse',
      locationName: data.locationName || 'Main Warehouse',
      transactionType: data.transactionType || 'ADJUSTMENT',
      quantity: Number(data.quantity),
      reference: data.reference || 'N/A',
      createdBy: data.createdBy || 'System',
      notes: data.notes || '',
    };

    this.memoryMovements.unshift(entry);
    return entry;
  }
}

module.exports = new StockMovementService();
