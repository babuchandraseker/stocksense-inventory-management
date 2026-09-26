import { supabase } from '../lib/supabase';
import { Receipt, ReceiptItem, ReceiptStatus } from '../types/inventory';

export interface CreateReceiptData {
  supplierId?: string;
  supplier?: string;
  locationId?: string;
  warehouseId?: string;
  receiptNumber?: string;
  receiptDate?: string;
  notes?: string;
  createdBy?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    productName?: string;
    sku?: string;
    unit?: string;
  }>;
}

export function mapDbReceiptToReceipt(row: any): Receipt {
  const items: ReceiptItem[] = (row.items || []).map((item: any) => ({
    productId: item.product_id || item.productId,
    productName: item.product?.name || item.productName || 'Product',
    sku: item.product?.sku || item.sku || '',
    quantity: Number(item.quantity || 0),
    unit: item.product?.unit_of_measure || item.unit || 'pcs',
    unitPrice: Number(item.unitPrice || 0),
    totalPrice: Number(item.totalPrice || 0),
  }));

  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
  const supplierName = row.supplier?.name || row.supplier || 'Standard Supplier';
  const warehouseName = row.location?.warehouse?.name || row.warehouseName || 'Central Logistics Hub';
  const warehouseId = row.location?.warehouse?.id || row.location?.warehouse_id || row.warehouseId || 'wh-main';

  return {
    id: String(row.id),
    receiptNumber: row.receipt_number || row.receiptNumber || `REC-${row.id.slice(0, 6).toUpperCase()}`,
    supplier: supplierName,
    warehouseId,
    warehouseName,
    receiptDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    productsCount: items.length,
    totalQuantity,
    items,
    status: (row.status || 'Draft') as ReceiptStatus,
    createdBy: row.created_by || 'Admin',
    notes: row.notes || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export const receiptService = {
  /**
   * 1. List all receipts
   */
  async listReceipts(filters?: { status?: string; locationId?: string }): Promise<Receipt[]> {
    try {
      let query = supabase
        .from('receipts')
        .select(`
          id,
          receipt_number,
          supplier_id,
          location_id,
          status,
          created_by,
          validated_by,
          validated_at,
          created_at,
          supplier:suppliers(id, name),
          location:locations(id, name, code, warehouse_id, warehouse:warehouses(id, name, code)),
          items:receipt_items(
            id,
            quantity,
            product_id,
            product:products(id, name, sku, unit_of_measure)
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'All') {
        query = query.ilike('status', filters.status);
      }
      if (filters?.locationId && filters.locationId !== 'All') {
        query = query.eq('location_id', filters.locationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(mapDbReceiptToReceipt);
    } catch (err: any) {
      console.error('[receiptService.listReceipts] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 2. Get receipt details by ID
   */
  async getReceiptDetails(receiptId: string): Promise<Receipt | null> {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          id,
          receipt_number,
          supplier_id,
          location_id,
          status,
          created_by,
          validated_by,
          validated_at,
          created_at,
          supplier:suppliers(id, name),
          location:locations(id, name, code, warehouse_id, warehouse:warehouses(id, name, code)),
          items:receipt_items(
            id,
            quantity,
            product_id,
            product:products(id, name, sku, unit_of_measure)
          )
        `)
        .eq('id', receiptId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapDbReceiptToReceipt(data);
    } catch (err: any) {
      console.error('[receiptService.getReceiptDetails] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 3. Create receipt
   */
  async createReceipt(receiptData: CreateReceiptData): Promise<Receipt> {
    try {
      let supplierId = receiptData.supplierId;
      if (!supplierId && receiptData.supplier) {
        const { data: existingSupp } = await supabase
          .from('suppliers')
          .select('id')
          .ilike('name', receiptData.supplier.trim())
          .maybeSingle();

        if (existingSupp) {
          supplierId = existingSupp.id;
        } else {
          const { data: newSupp } = await supabase
            .from('suppliers')
            .insert({ name: receiptData.supplier.trim() })
            .select()
            .single();
          if (newSupp) supplierId = newSupp.id;
        }
      }

      let locationId = receiptData.locationId;
      if (!locationId) {
        const { data: loc } = await supabase.from('locations').select('id').limit(1).maybeSingle();
        if (loc) locationId = loc.id;
      }

      const receiptNumber = receiptData.receiptNumber || `REC-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: receipt, error } = await supabase
        .from('receipts')
        .insert({
          receipt_number: receiptNumber,
          supplier_id: supplierId || null,
          location_id: locationId || null,
          status: 'Draft',
          created_by: receiptData.createdBy || 'Admin',
        })
        .select()
        .single();

      if (error) throw error;

      if (receiptData.items && receiptData.items.length > 0) {
        await this.addReceiptItems(receipt.id, receiptData.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })));
      }

      const fullReceipt = await this.getReceiptDetails(receipt.id);
      if (!fullReceipt) throw new Error('Receipt creation failed');
      return fullReceipt;
    } catch (err: any) {
      console.error('[receiptService.createReceipt] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 4. Add receipt items
   */
  async addReceiptItems(receiptId: string, items: Array<{ productId: string; quantity: number }>): Promise<void> {
    try {
      const rows = items.map((item) => ({
        receipt_id: receiptId,
        product_id: item.productId,
        quantity: item.quantity,
      }));

      const { error } = await supabase.from('receipt_items').insert(rows);
      if (error) throw error;
    } catch (err: any) {
      console.error('[receiptService.addReceiptItems] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 5. Validate receipt using PostgreSQL RPC function
   */
  async validateReceipt(receiptId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('validate_receipt', {
        p_receipt_id: receiptId,
      });

      if (error) throw error;

      // Update local receipt status to confirmed/validated
      await supabase
        .from('receipts')
        .update({
          status: 'Confirmed',
          validated_at: new Date().toISOString(),
        })
        .eq('id', receiptId);

      return data;
    } catch (err: any) {
      console.error('[receiptService.validateReceipt] RPC Error:', err.message || err);
      throw err;
    }
  },
};
