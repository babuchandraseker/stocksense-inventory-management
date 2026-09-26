import { supabase } from '../lib/supabase';
import { Transfer, TransferStatus } from '../types/inventory';

export interface CreateTransferData {
  sourceLocationId?: string;
  destinationLocationId?: string;
  fromWarehouseId?: string;
  fromWarehouseName?: string;
  toWarehouseId?: string;
  toWarehouseName?: string;
  productId?: string;
  productName?: string;
  sku?: string;
  quantity?: number;
  transferNumber?: string;
  createdBy?: string;
  notes?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    productName?: string;
    sku?: string;
  }>;
}

export function mapDbTransferToTransfer(row: any): Transfer {
  const items = row.items || [];
  const firstItem = items[0] || {};
  const product = firstItem.product || {};

  const totalQuantity = items.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0) || Number(firstItem.quantity || 0);

  const fromWarehouseName = row.source_location?.warehouse?.name || row.source_location?.name || 'Main Warehouse';
  const fromWarehouseId = row.source_location?.warehouse_id || row.source_location_id || 'wh-main';
  const toWarehouseName = row.destination_location?.warehouse?.name || row.destination_location?.name || 'Secondary Warehouse';
  const toWarehouseId = row.destination_location?.warehouse_id || row.destination_location_id || 'wh-sec';

  return {
    id: String(row.id),
    transferNumber: row.transfer_number || `TRF-${row.id.slice(0, 6).toUpperCase()}`,
    fromWarehouseId,
    fromWarehouseName,
    toWarehouseId,
    toWarehouseName,
    productId: firstItem.product_id || '',
    productName: product.name || 'Multiple Items',
    sku: product.sku || '',
    quantity: totalQuantity,
    status: (row.status || 'Pending') as TransferStatus,
    transferDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    createdBy: row.created_by || 'Admin',
    notes: row.notes || '',
  };
}

export const transferService = {
  /**
   * 1. List all internal transfers
   */
  async listTransfers(filters?: { status?: string; sourceLocationId?: string; destinationLocationId?: string }): Promise<Transfer[]> {
    try {
      let query = supabase
        .from('internal_transfers')
        .select(`
          id,
          transfer_number,
          source_location_id,
          destination_location_id,
          status,
          created_by,
          validated_by,
          validated_at,
          created_at,
          source_location:locations!source_location_id(id, name, code, warehouse_id, warehouse:warehouses(id, name, code)),
          destination_location:locations!destination_location_id(id, name, code, warehouse_id, warehouse:warehouses(id, name, code)),
          items:transfer_items(
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
      if (filters?.sourceLocationId && filters.sourceLocationId !== 'All') {
        query = query.eq('source_location_id', filters.sourceLocationId);
      }
      if (filters?.destinationLocationId && filters.destinationLocationId !== 'All') {
        query = query.eq('destination_location_id', filters.destinationLocationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(mapDbTransferToTransfer);
    } catch (err: any) {
      console.error('[transferService.listTransfers] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 2. Get transfer details by ID
   */
  async getTransferDetails(transferId: string): Promise<Transfer | null> {
    try {
      const { data, error } = await supabase
        .from('internal_transfers')
        .select(`
          id,
          transfer_number,
          source_location_id,
          destination_location_id,
          status,
          created_by,
          validated_by,
          validated_at,
          created_at,
          source_location:locations!source_location_id(id, name, code, warehouse_id, warehouse:warehouses(id, name, code)),
          destination_location:locations!destination_location_id(id, name, code, warehouse_id, warehouse:warehouses(id, name, code)),
          items:transfer_items(
            id,
            quantity,
            product_id,
            product:products(id, name, sku, unit_of_measure)
          )
        `)
        .eq('id', transferId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapDbTransferToTransfer(data);
    } catch (err: any) {
      console.error('[transferService.getTransferDetails] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 3. Create transfer
   */
  async createTransfer(transferData: CreateTransferData): Promise<Transfer> {
    try {
      let sourceLocationId = transferData.sourceLocationId;
      let destLocationId = transferData.destinationLocationId;

      if (!sourceLocationId || !destLocationId) {
        const { data: locs } = await supabase.from('locations').select('id').limit(2);
        if (locs && locs.length > 0) {
          if (!sourceLocationId) sourceLocationId = locs[0].id;
          if (!destLocationId) destLocationId = locs.length > 1 ? locs[1].id : locs[0].id;
        }
      }

      const transferNumber = transferData.transferNumber || `TRF-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: transfer, error } = await supabase
        .from('internal_transfers')
        .insert({
          transfer_number: transferNumber,
          source_location_id: sourceLocationId || null,
          destination_location_id: destLocationId || null,
          status: 'Pending',
          created_by: transferData.createdBy || 'Admin',
        })
        .select()
        .single();

      if (error) throw error;

      // Add transfer items
      const itemsToAdd = transferData.items && transferData.items.length > 0
        ? transferData.items
        : transferData.productId && transferData.quantity
          ? [{ productId: transferData.productId, quantity: transferData.quantity }]
          : [];

      if (itemsToAdd.length > 0) {
        await this.addTransferItems(transfer.id, itemsToAdd);
      }

      const fullTransfer = await this.getTransferDetails(transfer.id);
      if (!fullTransfer) throw new Error('Transfer creation failed');
      return fullTransfer;
    } catch (err: any) {
      console.error('[transferService.createTransfer] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 4. Add transfer items
   */
  async addTransferItems(transferId: string, items: Array<{ productId: string; quantity: number }>): Promise<void> {
    try {
      const rows = items.map((item) => ({
        transfer_id: transferId,
        product_id: item.productId,
        quantity: item.quantity,
      }));

      const { error } = await supabase.from('transfer_items').insert(rows);
      if (error) throw error;
    } catch (err: any) {
      console.error('[transferService.addTransferItems] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 5. Validate transfer using PostgreSQL RPC function
   */
  async validateTransfer(transferId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('validate_transfer', {
        p_transfer_id: transferId,
      });

      if (error) throw error;

      await supabase
        .from('internal_transfers')
        .update({
          status: 'Completed',
          validated_at: new Date().toISOString(),
        })
        .eq('id', transferId);

      return data;
    } catch (err: any) {
      console.error('[transferService.validateTransfer] RPC Error:', err.message || err);
      throw err;
    }
  },
};
