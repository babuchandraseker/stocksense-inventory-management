import { supabase } from '../lib/supabase';
import { Product } from '../types/inventory';
import { productService } from './productService';

export interface StockLevel {
  id: string;
  quantity: number;
  location_id: string;
  product_id: string;
  updated_at?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit_of_measure?: string;
  };
  location?: {
    id: string;
    name: string;
    code: string;
    warehouse_id: string;
    warehouse?: {
      id: string;
      name: string;
      code: string;
    };
  };
}

export const inventoryService = {
  /**
   * 1. Get all stock levels with optional filtering
   */
  async getStockLevels(filters?: { locationId?: string; productId?: string }): Promise<StockLevel[]> {
    try {
      let query = supabase
        .from('stock_levels')
        .select(`
          id,
          quantity,
          location_id,
          product_id,
          updated_at,
          product:products(id, name, sku, unit_of_measure),
          location:locations(id, name, code, warehouse_id, warehouse:warehouses(id, name, code))
        `)
        .order('updated_at', { ascending: false });

      if (filters?.locationId && filters.locationId !== 'All') {
        query = query.eq('location_id', filters.locationId);
      }
      if (filters?.productId && filters.productId !== 'All') {
        query = query.eq('product_id', filters.productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as StockLevel[];
    } catch (err: any) {
      console.error('[inventoryService.getStockLevels] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 2. Get stock levels by Product ID
   */
  async getStockByProduct(productId: string): Promise<StockLevel[]> {
    return this.getStockLevels({ productId });
  },

  /**
   * 3. Get stock levels by Location ID
   */
  async getStockByLocation(locationId: string): Promise<StockLevel[]> {
    return this.getStockLevels({ locationId });
  },

  /**
   * 4. Get low-stock products
   */
  async getLowStockProducts(): Promise<Product[]> {
    const products = await productService.getProducts();
    return products.filter((p) => p.status === 'Low Stock');
  },

  /**
   * 5. Get out-of-stock products
   */
  async getOutOfStockProducts(): Promise<Product[]> {
    const products = await productService.getProducts();
    return products.filter((p) => p.status === 'Out of Stock');
  },
};
