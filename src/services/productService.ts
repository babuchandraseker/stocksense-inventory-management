import { supabase } from '../lib/supabase';
import { Product, ProductStatus } from '../types/inventory';

export interface DbProduct {
  id: string;
  name: string;
  sku: string;
  category_id?: string | null;
  unit_of_measure?: string | null;
  created_at?: string;
  updated_at?: string;
  category?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  stock_levels?: Array<{
    id: string;
    quantity: number;
    location_id?: string;
  }> | null;
  reordering_rules?: Array<{
    id: string;
    minimum_quantity?: number;
    maximum_quantity?: number;
    reorder_quantity?: number;
  }> | null;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  categoryId?: string;
  categoryName?: string;
  unit?: string;
  supplier?: string;
  currentStock?: number;
  reorderLevel?: number;
  warehouseId?: string;
  warehouseName?: string;
  costPrice?: number;
  sellingPrice?: number;
  description?: string;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  categoryId?: string;
  categoryName?: string;
  unit?: string;
  supplier?: string;
  currentStock?: number;
  reorderLevel?: number;
  warehouseId?: string;
  warehouseName?: string;
  costPrice?: number;
  sellingPrice?: number;
  description?: string;
}

/**
 * Calculates human-readable status based on stock and reorder point
 */
export function calculateStockStatus(currentStock: number, reorderLevel: number): ProductStatus {
  if (currentStock <= 0) return 'Out of Stock';
  if (currentStock <= reorderLevel) return 'Low Stock';
  return 'In Stock';
}

/**
 * Maps raw database product join to UI Product model
 */
export function mapDbProductToProduct(row: any): Product {
  const stockLevels = Array.isArray(row.stock_levels) ? row.stock_levels : [];
  const currentStock = stockLevels.reduce((sum: number, sl: any) => sum + Number(sl.quantity || 0), 0);
  
  const reorderRules = Array.isArray(row.reordering_rules) ? row.reordering_rules : [];
  const reorderLevel = reorderRules.length > 0 ? Number(reorderRules[0].minimum_quantity || 10) : 10;

  const categoryName = row.category?.name || row.category_name || row.category || 'General';
  const unit = row.unit_of_measure || row.unit || 'pcs';

  return {
    id: String(row.id),
    name: row.name || 'Unnamed Product',
    sku: row.sku || '',
    category: categoryName,
    unit,
    supplier: row.supplier || 'Standard Supplier',
    currentStock,
    reorderLevel,
    warehouseId: row.warehouse_id || 'wh-main',
    warehouseName: row.warehouse_name || 'Central Logistics Hub',
    status: calculateStockStatus(currentStock, reorderLevel),
    description: row.description || '',
    costPrice: Number(row.cost_price || 0),
    sellingPrice: Number(row.selling_price || 0),
    lastUpdated: row.updated_at || row.created_at || new Date().toISOString(),
  };
}

export const productService = {
  /**
   * 1. Get all products with optional filters
   */
  async getProducts(filters?: { categoryId?: string; category?: string; search?: string }): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          category_id,
          unit_of_measure,
          created_at,
          updated_at,
          category:categories(id, name, description),
          stock_levels(id, quantity, location_id),
          reordering_rules(id, minimum_quantity, maximum_quantity, reorder_quantity)
        `)
        .order('name', { ascending: true });

      if (filters?.categoryId && filters.categoryId !== 'All') {
        query = query.eq('category_id', filters.categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let products = (data || []).map(mapDbProductToProduct);

      if (filters?.category && filters.category !== 'All') {
        products = products.filter((p) => p.category.toLowerCase() === filters.category?.toLowerCase());
      }

      if (filters?.search) {
        const s = filters.search.toLowerCase();
        products = products.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
      }

      return products;
    } catch (err: any) {
      console.error('[productService.getProducts] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 2. Search products by name or SKU
   */
  async searchProducts(searchTerm: string): Promise<Product[]> {
    return this.getProducts({ search: searchTerm });
  },

  /**
   * 3. Filter products by category
   */
  async filterByCategory(categoryNameOrId: string): Promise<Product[]> {
    return this.getProducts({ category: categoryNameOrId });
  },

  /**
   * 4. Get product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          category_id,
          unit_of_measure,
          created_at,
          updated_at,
          category:categories(id, name, description),
          stock_levels(id, quantity, location_id),
          reordering_rules(id, minimum_quantity, maximum_quantity, reorder_quantity)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapDbProductToProduct(data);
    } catch (err: any) {
      console.error('[productService.getProductById] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 5. Create a new product
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    try {
      let categoryId = input.categoryId;

      // If category name is provided but no ID, look up or create category
      if (!categoryId && input.categoryName) {
        const { data: catData } = await supabase
          .from('categories')
          .select('id')
          .ilike('name', input.categoryName.trim())
          .maybeSingle();

        if (catData) {
          categoryId = catData.id;
        } else {
          const { data: newCat } = await supabase
            .from('categories')
            .insert({ name: input.categoryName.trim() })
            .select()
            .single();
          if (newCat) categoryId = newCat.id;
        }
      }

      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name: input.name.trim(),
          sku: input.sku.trim().toUpperCase(),
          category_id: categoryId || null,
          unit_of_measure: input.unit || 'pcs',
        })
        .select(`
          id,
          name,
          sku,
          category_id,
          unit_of_measure,
          created_at,
          updated_at,
          category:categories(id, name, description)
        `)
        .single();

      if (error) throw error;

      // Add reordering rule if reorder level provided
      if (input.reorderLevel !== undefined) {
        await supabase.from('reordering_rules').insert({
          product_id: product.id,
          minimum_quantity: input.reorderLevel,
          reorder_quantity: input.reorderLevel * 2,
        });
      }

      // Add initial stock level if provided and location exists
      if (input.currentStock && input.currentStock > 0) {
        const { data: loc } = await supabase.from('locations').select('id').limit(1).maybeSingle();
        if (loc) {
          await supabase.from('stock_levels').insert({
            product_id: product.id,
            location_id: loc.id,
            quantity: input.currentStock,
          });

          await supabase.from('stock_ledger').insert({
            product_id: product.id,
            location_id: loc.id,
            quantity: input.currentStock,
            transaction_type: 'RECEIPT',
            reference_type: 'INITIAL_STOCK',
            created_by: 'Admin',
          });
        }
      }

      return mapDbProductToProduct({
        ...product,
        stock_levels: input.currentStock ? [{ quantity: input.currentStock }] : [],
        reordering_rules: input.reorderLevel ? [{ minimum_quantity: input.reorderLevel }] : [],
        supplier: input.supplier,
        cost_price: input.costPrice,
        selling_price: input.sellingPrice,
      });
    } catch (err: any) {
      console.error('[productService.createProduct] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 6. Update product
   */
  async updateProduct(id: string, updates: UpdateProductInput): Promise<Product> {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name.trim();
      if (updates.sku !== undefined) dbUpdates.sku = updates.sku.trim().toUpperCase();
      if (updates.unit !== undefined) dbUpdates.unit_of_measure = updates.unit;
      if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('products')
          .update(dbUpdates)
          .eq('id', id);

        if (error) throw error;
      }

      // Update reordering rule if reorder level provided
      if (updates.reorderLevel !== undefined) {
        const { data: existingRule } = await supabase
          .from('reordering_rules')
          .select('id')
          .eq('product_id', id)
          .maybeSingle();

        if (existingRule) {
          await supabase
            .from('reordering_rules')
            .update({ minimum_quantity: updates.reorderLevel })
            .eq('id', existingRule.id);
        } else {
          await supabase.from('reordering_rules').insert({
            product_id: id,
            minimum_quantity: updates.reorderLevel,
          });
        }
      }

      // Update stock level if specified
      if (updates.currentStock !== undefined) {
        const { data: existingLevel } = await supabase
          .from('stock_levels')
          .select('id')
          .eq('product_id', id)
          .maybeSingle();

        if (existingLevel) {
          await supabase
            .from('stock_levels')
            .update({ quantity: updates.currentStock })
            .eq('id', existingLevel.id);
        } else {
          const { data: loc } = await supabase.from('locations').select('id').limit(1).maybeSingle();
          if (loc) {
            await supabase.from('stock_levels').insert({
              product_id: id,
              location_id: loc.id,
              quantity: updates.currentStock,
            });
          }
        }
      }

      const updated = await this.getProductById(id);
      if (!updated) throw new Error('Failed to retrieve updated product');
      return updated;
    } catch (err: any) {
      console.error('[productService.updateProduct] Error:', err.message || err);
      throw err;
    }
  },

  /**
   * 7. Delete product
   */
  async deleteProduct(id: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('[productService.deleteProduct] Error:', err.message || err);
      throw err;
    }
  },
};
