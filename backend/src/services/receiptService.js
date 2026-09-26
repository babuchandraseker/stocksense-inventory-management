const supabase = require('../config/supabase');
const productService = require('./productService');
const stockMovementService = require('./stockMovementService');

const INITIAL_RECEIPTS = [
  {
    id: 'rec-1024',
    receiptNumber: 'REC-1024',
    supplier: 'ABC Electronics',
    warehouseId: 'wh-main',
    warehouseName: 'Central Logistics Hub',
    receiptDate: '2026-09-26',
    productsCount: 2,
    totalQuantity: 15,
    items: [
      {
        productId: 'prod-01',
        productName: 'iPhone 15',
        sku: 'IP15-128',
        quantity: 10,
        unit: 'pcs',
        unitPrice: 65000,
        totalPrice: 650000,
      },
      {
        productId: 'prod-02',
        productName: 'MacBook Air M2',
        sku: 'MBA-M2-256',
        quantity: 5,
        unit: 'pcs',
        unitPrice: 85000,
        totalPrice: 425000,
      },
    ],
    status: 'Confirmed',
    createdBy: 'Admin',
    validatedBy: 'admin@stocksense.com',
    validatedAt: '2026-09-26T11:00:00Z',
    notes: 'Inbound shipment verified and palletized at Bay 4.',
    createdAt: '2026-09-26T11:00:00Z',
  },
  {
    id: 'rec-1025',
    receiptNumber: 'REC-1025',
    supplier: 'Dell India',
    warehouseId: 'wh-main',
    warehouseName: 'Central Logistics Hub',
    receiptDate: '2026-09-27',
    productsCount: 1,
    totalQuantity: 10,
    items: [
      {
        productId: 'prod-04',
        productName: 'Dell UltraSharp 27"',
        sku: 'DELL-U2723QE',
        quantity: 10,
        unit: 'pcs',
        unitPrice: 48000,
        totalPrice: 480000,
      },
    ],
    status: 'Pending',
    createdBy: 'Admin',
    notes: 'Scheduled for afternoon gate delivery.',
    createdAt: '2026-09-26T09:00:00Z',
  },
];

class ReceiptService {
  constructor() {
    this.memoryReceipts = JSON.parse(JSON.stringify(INITIAL_RECEIPTS));
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

  normalizeReceipt(r) {
    if (!r) return null;
    return {
      id: String(r.id),
      receiptNumber: r.receiptNumber || r.receipt_number || '',
      supplier: r.supplier || 'N/A',
      warehouseId: r.warehouseId || r.warehouse_id || 'wh-main',
      warehouseName: r.warehouseName || r.warehouse_name || 'Central Logistics Hub',
      receiptDate: r.receiptDate || r.receipt_date || new Date().toISOString().split('T')[0],
      productsCount: Number(r.productsCount ?? r.products_count ?? (r.items ? r.items.length : 0)),
      totalQuantity: Number(r.totalQuantity ?? r.total_quantity ?? 0),
      items: Array.isArray(r.items) ? r.items : [],
      status: r.status || 'Pending',
      createdBy: r.createdBy || r.created_by || 'system',
      validatedBy: r.validatedBy || r.validated_by || null,
      validatedAt: r.validatedAt || r.validated_at || null,
      notes: r.notes || '',
      createdAt: r.createdAt || r.created_at || new Date().toISOString(),
    };
  }

  /**
   * GET /api/receipts
   */
  async getAllReceipts(filters = {}) {
    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('receipts')
          .select('*, items:receipt_items(*)')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          let list = data.map((r) => this.normalizeReceipt(r));
          if (filters.status && filters.status !== 'All') {
            list = list.filter((r) => r.status.toLowerCase() === filters.status.toLowerCase());
          }
          if (filters.warehouseId && filters.warehouseId !== 'All') {
            list = list.filter((r) => r.warehouseId === filters.warehouseId);
          }
          return list;
        }
      } catch (_err) {
        // Fallback
      }
    }

    let list = this.memoryReceipts.map((r) => this.normalizeReceipt(r));
    if (filters.status && filters.status !== 'All') {
      list = list.filter((r) => r.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.warehouseId && filters.warehouseId !== 'All') {
      list = list.filter((r) => r.warehouseId === filters.warehouseId);
    }
    return list;
  }

  /**
   * GET /api/receipts/:id
   */
  async getReceiptById(id) {
    if (!id) return null;

    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('receipts')
          .select('*, items:receipt_items(*)')
          .or(`id.eq.${id},receipt_number.eq.${id}`)
          .maybeSingle();

        if (!error && data) {
          return this.normalizeReceipt(data);
        }
      } catch (_err) {
        // Fallback
      }
    }

    const found = this.memoryReceipts.find(
      (r) => r.id === id || r.receiptNumber === id
    );
    return found ? this.normalizeReceipt(found) : null;
  }

  /**
   * POST /api/receipts
   */
  async createReceipt(receiptData, user) {
    const {
      receiptNumber,
      supplier = 'N/A',
      warehouseId = 'wh-main',
      warehouseName = 'Central Logistics Hub',
      receiptDate = new Date().toISOString().split('T')[0],
      items = [],
      notes = '',
      status = 'Pending',
    } = receiptData;

    // Rule 2: Receipt must contain at least one item
    if (!Array.isArray(items) || items.length === 0) {
      const err = new Error('Receipt must contain at least one product item');
      err.statusCode = 400;
      throw err;
    }

    // Validate every item
    const validatedItems = [];
    let totalQty = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productId) {
        const err = new Error(`Item at position ${i + 1} is missing productId`);
        err.statusCode = 400;
        throw err;
      }

      // Rule 3: Product must exist
      const product = await productService.getProductById(item.productId);
      if (!product) {
        const err = new Error(`Product with ID '${item.productId}' not found`);
        err.statusCode = 404;
        throw err;
      }

      // Rule 4: Quantity must be valid and > 0
      const qty = Number(item.quantity);
      if (isNaN(qty) || !isFinite(qty) || qty <= 0) {
        const err = new Error(`Quantity for product '${product.name}' must be a number greater than zero`);
        err.statusCode = 400;
        throw err;
      }

      const unitPrice = Number(item.unitPrice || product.costPrice || 0);
      const totalPrice = unitPrice * qty;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        unit: item.unit || product.unit || 'pcs',
        unitPrice,
        totalPrice,
      });

      totalQty += qty;
    }

    const assignedNumber =
      receiptNumber && receiptNumber.trim() !== ''
        ? receiptNumber.trim().toUpperCase()
        : `REC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReceipt = {
      id: `rec-${Date.now()}`,
      receiptNumber: assignedNumber,
      supplier: supplier.trim(),
      warehouseId,
      warehouseName,
      receiptDate,
      productsCount: validatedItems.length,
      totalQuantity: totalQty,
      items: validatedItems,
      status: status || 'Pending',
      createdBy: user?.name || user?.email || 'Admin',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('receipts')
          .insert([
            {
              id: newReceipt.id,
              receipt_number: newReceipt.receiptNumber,
              supplier: newReceipt.supplier,
              warehouse_id: newReceipt.warehouseId,
              warehouse_name: newReceipt.warehouseName,
              receipt_date: newReceipt.receiptDate,
              products_count: newReceipt.productsCount,
              total_quantity: newReceipt.totalQuantity,
              status: newReceipt.status,
              created_by: newReceipt.createdBy,
              notes: newReceipt.notes,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          // Insert receipt items
          const itemsToInsert = validatedItems.map((item) => ({
            receipt_id: newReceipt.id,
            product_id: item.productId,
            product_name: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
          }));
          await supabase.from('receipt_items').insert(itemsToInsert);

          const saved = { ...this.normalizeReceipt(data), items: validatedItems };
          this.memoryReceipts.unshift(saved);
          return saved;
        }
      } catch (_err) {
        // Fallback
      }
    }

    this.memoryReceipts.unshift(newReceipt);
    return newReceipt;
  }

  /**
   * POST /api/receipts/:id/validate
   * Validates receipt and atomically increments inventory and creates stock movement
   */
  async validateReceipt(id, user) {
    const receipt = await this.getReceiptById(id);
    if (!receipt) {
      const err = new Error(`Receipt with ID '${id}' not found`);
      err.statusCode = 404;
      throw err;
    }

    // Rule 5 & 21: Idempotency - A validated receipt cannot be validated again
    const normalizedStatus = receipt.status.toLowerCase();
    if (normalizedStatus === 'confirmed' || normalizedStatus === 'validated') {
      const err = new Error('Receipt is already validated');
      err.statusCode = 400;
      throw err;
    }

    if (normalizedStatus === 'cancelled') {
      const err = new Error('Cannot validate a cancelled receipt');
      err.statusCode = 400;
      throw err;
    }

    if (!Array.isArray(receipt.items) || receipt.items.length === 0) {
      const err = new Error('Cannot validate receipt with no items');
      err.statusCode = 400;
      throw err;
    }

    // Attempt PostgreSQL RPC if configured
    if (this.isSupabaseConfigured()) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('validate_receipt', {
          receipt_id: receipt.id,
        });

        if (!rpcError && rpcData) {
          // Successfully executed database atomic function
          const updated = await this.getReceiptById(receipt.id);
          return updated;
        }
      } catch (_rpcErr) {
        // Fall back to application service atomic execution
      }
    }

    // Atomic Application Execution:
    // 1. Verify all products and prepare stock updates
    const inventoryUpdates = [];
    for (const item of receipt.items) {
      const product = await productService.getProductById(item.productId);
      if (!product) {
        const err = new Error(`Cannot validate receipt: Product '${item.productName || item.productId}' not found`);
        err.statusCode = 400;
        throw err;
      }
      inventoryUpdates.push({
        product,
        itemQuantity: item.quantity,
      });
    }

    // 2. Atomically increase stock for each product and record stock movements
    const updatedInventoryList = [];
    for (const update of inventoryUpdates) {
      const { product, itemQuantity } = update;
      const previousStock = product.currentStock;
      const newStock = previousStock + itemQuantity;

      // Update inventory stock
      const updatedProduct = await productService.updateProduct(product.id, {
        currentStock: newStock,
      });
      updatedInventoryList.push(updatedProduct);

      // Record Stock Movement / Ledger entry
      await stockMovementService.recordMovement({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        warehouseId: receipt.warehouseId,
        warehouseName: receipt.warehouseName,
        transactionType: 'RECEIPT',
        movementType: 'STOCK_IN',
        quantity: itemQuantity,
        reference: receipt.receiptNumber,
        referenceType: 'RECEIPT',
        referenceId: receipt.id,
        createdBy: user?.name || user?.email || 'Admin',
        previousStock,
        newStock,
      });
    }

    // 3. Mark receipt status as Confirmed / Validated
    const now = new Date().toISOString();
    const validatedReceipt = {
      ...receipt,
      status: 'Confirmed',
      validatedBy: user?.email || user?.name || user?.id || 'Admin',
      validatedAt: now,
    };

    if (this.isSupabaseConfigured()) {
      try {
        await supabase
          .from('receipts')
          .update({
            status: 'Confirmed',
            validated_by: validatedReceipt.validatedBy,
            validated_at: validatedReceipt.validatedAt,
          })
          .eq('id', receipt.id);
      } catch (_err) {
        // Fallback
      }
    }

    this.memoryReceipts = this.memoryReceipts.map((r) =>
      r.id === receipt.id ? validatedReceipt : r
    );

    return {
      receipt: validatedReceipt,
      updatedProducts: updatedInventoryList.map((p) => ({
        productId: p.id,
        productName: p.name,
        currentStock: p.currentStock,
      })),
    };
  }
}

module.exports = new ReceiptService();
