import { supabase } from '../lib/supabase';
import { LedgerEntry, TransactionType } from '../types/inventory';

export interface LedgerFilters {
  productId?: string;
  locationId?: string;
  warehouseId?: string;
  transactionType?: string;
  search?: string;
}

export function mapDbLedgerToLedgerEntry(row: any): LedgerEntry {
  const warehouseName = row.location?.warehouse?.name || 'Central Logistics Hub';
  const warehouseId = row.location?.warehouse?.id || row.location?.warehouse_id || 'wh-main';

  const rawTxType = (row.transaction_type || 'RECEIPT').toUpperCase();
  let transactionType: TransactionType = 'RECEIPT';
  if (['RECEIPT', 'TRANSFER_IN', 'TRANSFER_OUT', 'DELIVERY', 'ADJUSTMENT'].includes(rawTxType)) {
    transactionType = rawTxType as TransactionType;
  }

  const dateStr = row.created_at
    ? `${new Date(row.created_at).toLocaleDateString('en-CA')} ${new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : new Date().toISOString();

  const referenceStr = row.reference_type && row.reference_id
    ? `${row.reference_type}-${String(row.reference_id).slice(0, 6)}`
    : row.reference_type || 'TXN-GEN';

  return {
    id: String(row.id),
    date: dateStr,
    productId: row.product_id || '',
    productName: row.product?.name || 'Product',
    sku: row.product?.sku || '',
    warehouseId,
    warehouseName,
    transactionType,
    quantity: Number(row.quantity || 0),
    reference: referenceStr,
    createdBy: row.created_by || 'Admin',
  };
}

export const ledgerService = {
  /**
   * 1. Get movement history (sorted newest first)
   */
  async getMovementHistory(filters?: LedgerFilters): Promise<LedgerEntry[]> {
    try {
      let query = supabase
        .from('stock_ledger')
        .select(`
          id,
          quantity,
          location_id,
          transaction_type,
          reference_type,
          reference_id,
          created_by,
          product_id,
          created_at,
          product:products(id, name, sku, unit_of_measure),
          location:locations(id, name, code, warehouse_id, warehouse:warehouses(id, name, code))
        `)
        .order('created_at', { ascending: false });

      if (filters?.productId && filters.productId !== 'All') {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.locationId && filters.locationId !== 'All') {
        query = query.eq('location_id', filters.locationId);
      }
      if (filters?.transactionType && filters.transactionType !== 'All') {
        query = query.ilike('transaction_type', filters.transactionType);
      }

      const { data, error } = await query;
      if (error) throw error;

      let entries = (data || []).map(mapDbLedgerToLedgerEntry);

      if (filters?.warehouseId && filters.warehouseId !== 'All') {
        entries = entries.filter((e) => e.warehouseId === filters.warehouseId);
      }

      if (filters?.search) {
        const s = filters.search.toLowerCase();
        entries = entries.filter(
          (e) =>
            e.productName.toLowerCase().includes(s) ||
            e.sku.toLowerCase().includes(s) ||
            e.reference.toLowerCase().includes(s)
        );
      }

      return entries;
    } catch (err: any) {
      console.error('[ledgerService.getMovementHistory] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 2. Filter movements by product ID
   */
  async filterByProduct(productId: string): Promise<LedgerEntry[]> {
    return this.getMovementHistory({ productId });
  },

  /**
   * 3. Filter movements by location ID
   */
  async filterByLocation(locationId: string): Promise<LedgerEntry[]> {
    return this.getMovementHistory({ locationId });
  },

  /**
   * 4. Filter movements by transaction type
   */
  async filterByTransactionType(transactionType: string): Promise<LedgerEntry[]> {
    return this.getMovementHistory({ transactionType });
  },
};
