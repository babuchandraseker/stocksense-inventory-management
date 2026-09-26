const supabase = require('../config/supabase');
const productService = require('./productService');
const stockMovementService = require('./stockMovementService');

const INITIAL_RECEIPTS = [
  {
    id: 'rec-1001',
    receiptNumber: 'REC-1001',
    supplier: 'ABC Steel Supplier',
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    locationName: 'Main Warehouse',
    receiptDate: '2026-09-26',
    productsCount: 1,
    totalQuantity: 100,
    items: [
      {
        productId: 'prod-01',
        productName: 'Steel Rods',
        sku: 'STL-ROD-001',
        quantity: 100,
        unit: 'kg',
        unitPrice: 45,
        totalPrice: 4500,
      },
    ],
    status: 'Confirmed',
    createdBy: 'Admin',
    validatedBy: 'admin@stocksense.com',
    validatedAt: '2026-09-26T10:15:00Z',
    notes: 'Inbound consignment verified at receiving dock.',
    createdAt: '2026-09-26T10:15:00Z',
  },
  {
    id: 'rec-1002',
    receiptNumber: 'REC-1002',
    supplier: 'National Steel Corp',
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    locationName: 'Main Warehouse',
    receiptDate: '2026-09-26',
    productsCount: 1,
    totalQuantity: 50,
    items: [
      {
        productId: 'prod-02',
        productName: 'Steel',
        sku: 'STL-001',
        quantity: 50,
        unit: 'kg',
        unitPrice: 50,
        totalPrice: 2500,
      },
    ],
    status: 'Waiting',
    createdBy: 'Staff',
    notes: 'Scheduled for QA inspection.',
    createdAt: '2026-09-26T11:30:00Z',
  },
];

class ReceiptService {
  constructor() {
    this.memoryReceipts = [...INITIAL_RECEIPTS];
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

  async getAllReceipts(filters = {}) {
    let list = [...this.memoryReceipts];
    if (filters.status && filters.status !== 'All') {
      list = list.filter((r) => r.status.toLowerCase() === filters.status.toLowerCase());
    }
    return list;
  }

  async getReceiptById(id) {
    return this.memoryReceipts.find((r) => r.id === String(id) || r.receiptNumber === String(id)) || null;
  }

  async createReceipt(data) {
    const totalQuantity = (data.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const newReceipt = {
      id: `rec-${Date.now()}`,
      receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      supplier: data.supplier || 'ABC Steel Supplier',
      warehouseId: data.warehouseId || 'wh-main',
      warehouseName: data.warehouseName || 'Main Warehouse',
      locationName: data.locationName || 'Main Warehouse',
      receiptDate: data.receiptDate || new Date().toISOString().split('T')[0],
      productsCount: (data.items || []).length,
      totalQuantity,
      items: data.items || [],
      status: data.status || 'Draft',
      createdBy: data.createdBy || 'Admin',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };

    this.memoryReceipts.unshift(newReceipt);
    return newReceipt;
  }

  async validateReceipt(id, user = {}) {
    const receipt = await this.getReceiptById(id);
    if (!receipt) throw new Error('Receipt not found');
    if (receipt.status === 'Confirmed') {
      throw new Error('Receipt is already validated/confirmed');
    }

    // Increase stock for each item
    for (const item of receipt.items) {
      const prod = await productService.getProductById(item.productId);
      if (prod) {
        await productService.updateProduct(prod.id, {
          currentStock: prod.currentStock + Number(item.quantity),
        });

        await stockMovementService.recordMovement({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          warehouseId: receipt.warehouseId,
          warehouseName: receipt.warehouseName,
          transactionType: 'RECEIPT',
          quantity: Number(item.quantity),
          reference: receipt.receiptNumber,
          createdBy: user.email || 'Admin',
          notes: `Receipt validation +${item.quantity}`,
        });
      }
    }

    receipt.status = 'Confirmed';
    receipt.validatedBy = user.email || 'Admin';
    receipt.validatedAt = new Date().toISOString();

    return receipt;
  }
}

module.exports = new ReceiptService();
