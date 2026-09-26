import { supabase } from '../lib/supabase';
import { Warehouse } from '../types/inventory';

export interface Location {
  id: string;
  name: string;
  code: string;
  warehouse_id: string;
  created_at?: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
    address?: string;
  } | null;
}

export const warehouseService = {
  /**
   * Get all warehouses with location counts
   */
  async getWarehouses(): Promise<Warehouse[]> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select(`
          id,
          name,
          code,
          address,
          created_at,
          locations(id, name, code)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map((w: any) => ({
        id: String(w.id),
        name: w.name,
        code: w.code,
        location: w.address || 'Main Facility',
        address: w.address || '',
        totalProducts: 0,
        totalStock: 0,
        capacity: 10000,
        occupancyPercentage: 45,
        manager: 'Inventory Lead',
        contactNumber: '+1 (555) 019-2834',
        status: 'Active' as const,
      }));
    } catch (err: any) {
      console.error('[warehouseService.getWarehouses] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * Get locations, optionally filtered by warehouse ID
   */
  async getLocations(warehouseId?: string): Promise<Location[]> {
    try {
      let query = supabase
        .from('locations')
        .select(`
          id,
          name,
          code,
          warehouse_id,
          created_at,
          warehouse:warehouses(id, name, code, address)
        `)
        .order('name', { ascending: true });

      if (warehouseId && warehouseId !== 'All') {
        query = query.eq('warehouse_id', warehouseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Location[];
    } catch (err: any) {
      console.error('[warehouseService.getLocations] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * Get single warehouse by ID
   */
  async getWarehouseById(id: string): Promise<Warehouse | null> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: String(data.id),
        name: data.name,
        code: data.code,
        location: data.address || 'Main Facility',
        address: data.address || '',
        totalProducts: 0,
        totalStock: 0,
        capacity: 10000,
        occupancyPercentage: 45,
        manager: 'Inventory Lead',
        contactNumber: '+1 (555) 019-2834',
        status: 'Active',
      };
    } catch (err: any) {
      console.error('[warehouseService.getWarehouseById] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * Get single location by ID
   */
  async getLocationById(id: string): Promise<Location | null> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*, warehouse:warehouses(*)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return data as unknown as Location;
    } catch (err: any) {
      console.error('[warehouseService.getLocationById] Error:', err.message || err);
      throw err;
    }
  },
};
