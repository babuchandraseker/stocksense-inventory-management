import { supabase } from '../lib/supabase';
import { Adjustment, AdjustmentReason } from '../types/inventory';

export interface CreateAdjustmentData {
  locationId?: string;
  warehouseId?: string;
  warehouseName?: string;
  productId?: string;
  productName?: string;
  sku?: string;
  systemQuantity?: number;
  countedQuantity?: number;
  difference?: number;
  reason?: AdjustmentReason;
  adjustmentNumber?: string;
  createdBy?: string;
  notes?: string;
  items?: Array<{
    productId: string;
    countedQuantity: number;
    difference?: number;
    productName?: string;
    sku?: string;
  }>;
}

export function mapDbAdjustmentToAdjustment(row: any): Adjustment {
  const items = row.items || [];
  const firstItem = items[0] || {};
  const product = firstItem.product || {};

  const warehouseName = row.location?.warehouse?.name || 'Central Logistics Hub';
  const warehouseId = row.location?.warehouse?.id || row.location?.warehouse_id || 'wh-main';

  const countedQuantity = Number(firstItem.counted_quantity ?? firstItem.countedQuantity ?? 0);
  const difference = Number(firstItem.difference ?? 0);
  const systemQuantity = countedQuantity - difference;

  return {
    id: String(row.id),
    adjustmentNumber: row.adjustment_number || `ADJ-${row.id.slice(0, 6).toUpperCase()}`,
    productId: firstItem.product_id || '',
    productName: product.name || 'Inventory Stock',
    sku: product.sku || '',
    warehouseId,
    warehouseName,
    systemQuantity,
    countedQuantity,
    difference,
    reason: (row.reason || 'Counting Error') as AdjustmentReason,
    notes: row.reason || '',
    adjustmentDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    createdBy: row.created_by || 'Admin',
  };
}

export const adjustmentService = {
  /**
   * 1. List all stock adjustments
   */
  async listAdjustments(filters?: { status?: string; locationId?: string }): Promise<Adjustment[]> {
    try {
      let query = supabase
        .from('stock_adjustments')
        .select(`
          id,
          adjustment_number,
          location_id,
          status,
          reason,
          created_by,
          validated_by,
          validated_at,
          created_at,
          location:locations(id, name, code, warehouse_id, warehouse:warehouses(id, name, code)),
          items:adjustment_items(
            id,
            counted_quantity,
            difference,
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

      return (data || []).map(mapDbAdjustmentToAdjustment);
    } catch (err: any) {
      console.error('[adjustmentService.listAdjustments] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 2. Get adjustment details by ID
   */
  async getAdjustmentDetails(adjustmentId: string): Promise<Adjustment | null> {
    try {
      const { data, error } = await supabase
        .from('stock_adjustments')
        .select(`
          id,
          adjustment_number,
          location_id,
          status,
          reason,
          created_by,
          validated_by,
          validated_at,
          created_at,
          location:locations(id, name, code, warehouse_id, warehouse:warehouses(id, name, code)),
          items:adjustment_items(
            id,
            counted_quantity,
            difference,
            product_id,
            product:products(id, name, sku, unit_of_measure)
          )
        `)
        .eq('id', adjustmentId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapDbAdjustmentToAdjustment(data);
    } catch (err: any) {
      console.error('[adjustmentService.getAdjustmentDetails] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 3. Create stock adjustment
   */
  async createAdjustment(adjData: CreateAdjustmentData): Promise<Adjustment> {
    try {
      let locationId = adjData.locationId;
      if (!locationId) {
        const { data: loc } = await supabase.from('locations').select('id').limit(1).maybeSingle();
        if (loc) locationId = loc.id;
      }

      const adjustmentNumber = adjData.adjustmentNumber || `ADJ-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: adjustment, error } = await supabase
        .from('stock_adjustments')
        .insert({
          adjustment_number: adjustmentNumber,
          location_id: locationId || null,
          reason: adjData.reason || adjData.notes || 'Counting Error',
          status: 'Pending',
          created_by: adjData.createdBy || 'Admin',
        })
        .select()
        .single();

      if (error) throw error;

      const itemsToAdd = adjData.items && adjData.items.length > 0
        ? adjData.items
        : adjData.productId
          ? [{
              productId: adjData.productId,
              countedQuantity: adjData.countedQuantity || 0,
              difference: adjData.difference !== undefined ? adjData.difference : (adjData.countedQuantity || 0) - (adjData.systemQuantity || 0),
            }]
          : [];

      if (itemsToAdd.length > 0) {
        await this.addAdjustmentItems(adjustment.id, itemsToAdd);
      }

      const fullAdj = await this.getAdjustmentDetails(adjustment.id);
      if (!fullAdj) throw new Error('Adjustment creation failed');
      return fullAdj;
    } catch (err: any) {
      console.error('[adjustmentService.createAdjustment] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 4. Add adjustment items
   */
  async addAdjustmentItems(
    adjustmentId: string,
    items: Array<{ productId: string; countedQuantity: number; difference?: number }>
  ): Promise<void> {
    try {
      const rows = items.map((item) => ({
        adjustment_id: adjustmentId,
        product_id: item.productId,
        counted_quantity: item.countedQuantity,
        difference: item.difference !== undefined ? item.difference : 0,
      }));

      const { error } = await supabase.from('adjustment_items').insert(rows);
      if (error) throw error;
    } catch (err: any) {
      console.error('[adjustmentService.addAdjustmentItems] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 5. Validate adjustment using PostgreSQL RPC function
   */
  async validateAdjustment(adjustmentId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('validate_adjustment', {
        p_adjustment_id: adjustmentId,
      });

      if (error) throw error;

      await supabase
        .from('stock_adjustments')
        .update({
          status: 'Validated',
          validated_at: new Date().toISOString(),
        })
        .eq('id', adjustmentId);

      return data;
    } catch (err: any) {
      console.error('[adjustmentService.validateAdjustment] RPC Error:', err.message || err);
      throw err;
    }
  },
};
