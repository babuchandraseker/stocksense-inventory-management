import { supabase } from '../lib/supabase';
import { Delivery, DeliveryItem, DeliveryStatus } from '../types/inventory';

export interface CreateDeliveryData {
  customerName?: string;
  customer?: string;
  locationId?: string;
  warehouseId?: string;
  deliveryNumber?: string;
  orderDate?: string;
  createdBy?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    pickedQuantity?: number;
    productName?: string;
    sku?: string;
  }>;
}

export function mapDbDeliveryToDelivery(row: any): Delivery {
  const items: DeliveryItem[] = (row.items || []).map((item: any) => ({
    productId: item.product_id || item.productId,
    productName: item.product?.name || item.productName || 'Product',
    sku: item.product?.sku || item.sku || '',
    quantity: Number(item.quantity || 0),
    pickedQuantity: Number(item.quantity || 0),
  }));

  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
  const warehouseName = row.location?.warehouse?.name || 'Central Logistics Hub';
  const warehouseId = row.location?.warehouse?.id || row.location?.warehouse_id || 'wh-main';

  return {
    id: String(row.id),
    deliveryNumber: row.delivery_number || `DEL-${row.id.slice(0, 6).toUpperCase()}`,
    customer: row.customer_name || 'Standard Customer',
    destination: row.location?.name || 'Customer Location',
    warehouseId,
    warehouseName,
    orderDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    status: (row.status || 'Draft') as DeliveryStatus,
    productsCount: items.length,
    totalQuantity,
    items,
    createdBy: row.created_by || 'Admin',
  };
}

export const deliveryService = {
  /**
   * 1. List all deliveries
   */
  async listDeliveries(filters?: { status?: string; locationId?: string }): Promise<Delivery[]> {
    try {
      let query = supabase
        .from('deliveries')
        .select(`
          id,
          delivery_number,
          customer_name,
          location_id,
          status,
          created_by,
          validated_by,
          validated_at,
          created_at,
          location:locations(id, name, code, warehouse_id, warehouse:warehouses(id, name, code)),
          items:delivery_items(
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

      return (data || []).map(mapDbDeliveryToDelivery);
    } catch (err: any) {
      console.error('[deliveryService.listDeliveries] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 2. Get delivery details by ID
   */
  async getDeliveryDetails(deliveryId: string): Promise<Delivery | null> {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          id,
          delivery_number,
          customer_name,
          location_id,
          status,
          created_by,
          validated_by,
          validated_at,
          created_at,
          location:locations(id, name, code, warehouse_id, warehouse:warehouses(id, name, code)),
          items:delivery_items(
            id,
            quantity,
            product_id,
            product:products(id, name, sku, unit_of_measure)
          )
        `)
        .eq('id', deliveryId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapDbDeliveryToDelivery(data);
    } catch (err: any) {
      console.error('[deliveryService.getDeliveryDetails] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 3. Create delivery
   */
  async createDelivery(deliveryData: CreateDeliveryData): Promise<Delivery> {
    try {
      let locationId = deliveryData.locationId;
      if (!locationId) {
        const { data: loc } = await supabase.from('locations').select('id').limit(1).maybeSingle();
        if (loc) locationId = loc.id;
      }

      const deliveryNumber = deliveryData.deliveryNumber || `DEL-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: delivery, error } = await supabase
        .from('deliveries')
        .insert({
          delivery_number: deliveryNumber,
          customer_name: deliveryData.customerName || deliveryData.customer || 'Customer',
          location_id: locationId || null,
          status: 'Draft',
          created_by: deliveryData.createdBy || 'Admin',
        })
        .select()
        .single();

      if (error) throw error;

      if (deliveryData.items && deliveryData.items.length > 0) {
        await this.addDeliveryItems(delivery.id, deliveryData.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })));
      }

      const fullDelivery = await this.getDeliveryDetails(delivery.id);
      if (!fullDelivery) throw new Error('Delivery creation failed');
      return fullDelivery;
    } catch (err: any) {
      console.error('[deliveryService.createDelivery] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 4. Add delivery items
   */
  async addDeliveryItems(deliveryId: string, items: Array<{ productId: string; quantity: number }>): Promise<void> {
    try {
      const rows = items.map((item) => ({
        delivery_id: deliveryId,
        product_id: item.productId,
        quantity: item.quantity,
      }));

      const { error } = await supabase.from('delivery_items').insert(rows);
      if (error) throw error;
    } catch (err: any) {
      console.error('[deliveryService.addDeliveryItems] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 5. Validate delivery using PostgreSQL RPC function
   */
  async validateDelivery(deliveryId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('validate_delivery', {
        p_delivery_id: deliveryId,
      });

      if (error) throw error;

      await supabase
        .from('deliveries')
        .update({
          status: 'Validate',
          validated_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);

      return data;
    } catch (err: any) {
      console.error('[deliveryService.validateDelivery] RPC Error:', err.message || err);
      throw err;
    }
  },
};
