import { supabase } from '../lib/supabase';
import { productService } from './productService';

export interface DashboardStats {
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  pendingInternalTransfers: number;
  totalProducts?: number;
  totalValue?: number;
}

export const dashboardService = {
  /**
   * Get aggregated dashboard statistics
   */
  async getDashboardSummary(): Promise<DashboardStats> {
    try {
      // 1. Fetch products to calculate stock metrics
      const products = await productService.getProducts();

      const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);
      const lowStockCount = products.filter((p) => p.status === 'Low Stock').length;
      const outOfStockCount = products.filter((p) => p.status === 'Out of Stock').length;
      const totalValue = products.reduce(
        (sum, p) => sum + p.currentStock * (p.sellingPrice || p.costPrice || 0),
        0
      );

      // 2. Count pending receipts
      const { count: receiptsCount, error: recErr } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("Confirmed","Validated","Cancelled")');

      // 3. Count pending deliveries
      const { count: deliveriesCount, error: delErr } = await supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("Validate","Delivered","Cancelled")');

      // 4. Count pending internal transfers
      const { count: transfersCount, error: trfErr } = await supabase
        .from('internal_transfers')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("Completed","Cancelled")');

      return {
        totalStock,
        lowStockCount,
        outOfStockCount,
        pendingReceipts: recErr ? 0 : (receiptsCount || 0),
        pendingDeliveries: delErr ? 0 : (deliveriesCount || 0),
        pendingInternalTransfers: trfErr ? 0 : (transfersCount || 0),
        totalProducts: products.length,
        totalValue,
      };
    } catch (err: any) {
      console.error('[dashboardService.getDashboardSummary] Error:', err.message || err);
      throw err;
    }
  },
};
