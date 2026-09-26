import { supabase } from '../lib/supabase';

export interface Alert {
  id: string;
  location_id?: string;
  product_id?: string;
  alert_type: string;
  message: string;
  is_resolved: boolean;
  resolved_at?: string | null;
  created_at?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  location?: {
    id: string;
    name: string;
    warehouse?: {
      id: string;
      name: string;
    };
  };
}

export const alertService = {
  /**
   * 1. Get unresolved alerts
   */
  async getUnresolvedAlerts(): Promise<Alert[]> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          id,
          location_id,
          product_id,
          alert_type,
          message,
          is_resolved,
          resolved_at,
          created_at,
          product:products(id, name, sku),
          location:locations(id, name, code, warehouse:warehouses(id, name))
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Alert[];
    } catch (err: any) {
      console.error('[alertService.getUnresolvedAlerts] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 2. Mark alert as resolved
   */
  async markAlertAsResolved(alertId: string): Promise<Alert> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data as Alert;
    } catch (err: any) {
      console.error('[alertService.markAlertAsResolved] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 3. Get all alerts with optional filter
   */
  async getAllAlerts(filters?: { isResolved?: boolean; productId?: string; locationId?: string }): Promise<Alert[]> {
    try {
      let query = supabase
        .from('alerts')
        .select(`
          id,
          location_id,
          product_id,
          alert_type,
          message,
          is_resolved,
          resolved_at,
          created_at,
          product:products(id, name, sku),
          location:locations(id, name, code, warehouse:warehouses(id, name))
        `)
        .order('created_at', { ascending: false });

      if (filters?.isResolved !== undefined) {
        query = query.eq('is_resolved', filters.isResolved);
      }
      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.locationId) {
        query = query.eq('location_id', filters.locationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Alert[];
    } catch (err: any) {
      console.error('[alertService.getAllAlerts] Error:', err.message || err);
      throw err;
    }
  },
};
