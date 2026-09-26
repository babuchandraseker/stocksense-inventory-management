const supabase = require('../config/supabase');

// Default initial fallback catalog matching StockSense data model
const SEED_PRODUCTS = [
  {
    id: 'prod-01',
    name: 'iPhone 15',
    sku: 'IP15-128',
    category: 'Smartphones',
    unit: 'pcs',
    supplier: 'Apple Inc.',
    currentStock: 145,
    reorderLevel: 20,
    warehouseId: 'wh-main',
    warehouseName: 'Central Logistics Hub',
    status: 'In Stock',
    costPrice: 65000,
    sellingPrice: 79900,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prod-02',
    name: 'MacBook Air M2',
    sku: 'MBA-M2-256',
    category: 'Laptops',
    unit: 'pcs',
    supplier: 'Apple Inc.',
    currentStock: 8,
    reorderLevel: 15,
    warehouseId: 'wh-main',
    warehouseName: 'Central Logistics Hub',
    status: 'Low Stock',
    costPrice: 85000,
    sellingPrice: 99900,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prod-03',
    name: 'Sony WH-1000XM5',
    sku: 'SNY-XM5-BLK',
    category: 'Audio',
    unit: 'pcs',
    supplier: 'Sony Corp',
    currentStock: 0,
    reorderLevel: 10,
    warehouseId: 'wh-main',
    warehouseName: 'Central Logistics Hub',
    status: 'Out of Stock',
    costPrice: 22000,
    sellingPrice: 29990,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prod-04',
    name: 'Dell UltraSharp 27"',
    sku: 'DELL-U2723QE',
    category: 'Accessories',
    unit: 'pcs',
    supplier: 'Dell India',
    currentStock: 52,
    reorderLevel: 10,
    warehouseId: 'wh-main',
    warehouseName: 'Central Logistics Hub',
    status: 'In Stock',
    costPrice: 48000,
    sellingPrice: 58500,
    lastUpdated: new Date().toISOString(),
  },
];

class ProductService {
  constructor() {
    // In-memory catalog for offline resilience / fallback
    this.memoryProducts = [...SEED_PRODUCTS];
  }

  isSupabaseConfigured() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    return !!(
      url &&
      key &&
      !url.includes('placeholder') &&
      !url.includes('your-project') &&
      !key.includes('placeholder') &&
      !key.includes('your_')
    );
  }

  /**
   * Helper: Normalize database record to unified camelCase format
   */
  normalizeProduct(p) {
    if (!p) return null;
    const currentStock = Number(
      p.currentStock ?? p.current_stock ?? p.quantity ?? p.stock ?? 0
    );
    const reorderLevel = Number(
      p.reorderLevel ?? p.reorder_level ?? p.reorder_point ?? 10
    );

    let status = 'In Stock';
    if (currentStock <= 0) {
      status = 'Out of Stock';
    } else if (currentStock <= reorderLevel) {
      status = 'Low Stock';
    }

    return {
      id: String(p.id),
      name: p.name || '',
      sku: p.sku || '',
      category: p.category || 'General',
      unit: p.unit || 'pcs',
      supplier: p.supplier || 'N/A',
      currentStock,
      reorderLevel,
      warehouseId: p.warehouseId || p.warehouse_id || 'wh-main',
      warehouseName: p.warehouseName || p.warehouse_name || 'Central Logistics Hub',
      status,
      description: p.description || '',
      costPrice: Number(p.costPrice ?? p.cost_price ?? 0),
      sellingPrice: Number(p.sellingPrice ?? p.selling_price ?? p.price ?? 0),
      lastUpdated: p.lastUpdated || p.last_updated || p.updated_at || new Date().toISOString(),
    };
  }

  /**
   * GET /api/products
   */
  async getAllProducts(filters = {}) {
    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          let results = data.map((p) => this.normalizeProduct(p));
          if (filters.category && filters.category !== 'All') {
            results = results.filter((p) => p.category === filters.category);
          }
          if (filters.search) {
            const s = filters.search.toLowerCase();
            results = results.filter(
              (p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)
            );
          }
          return results;
        }
      } catch (_err) {
        // Fallback to memory store
      }
    }

    let list = this.memoryProducts.map((p) => this.normalizeProduct(p));
    if (filters.category && filters.category !== 'All') {
      list = list.filter((p) => p.category === filters.category);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)
      );
    }
    return list;
  }

  /**
   * GET /api/products/:id
   */
  async getProductById(id) {
    if (!id) return null;

    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`id.eq.${id},sku.eq.${id}`)
          .maybeSingle();

        if (!error && data) {
          return this.normalizeProduct(data);
        }
      } catch (_err) {
        // Fallback to memory store
      }
    }

    const found = this.memoryProducts.find((p) => p.id === id || p.sku === id);
    return found ? this.normalizeProduct(found) : null;
  }

  /**
   * POST /api/products
   */
  async createProduct(productData, user) {
    const {
      name,
      sku,
      category = 'General',
      unit = 'pcs',
      supplier = 'N/A',
      currentStock = 0,
      reorderLevel = 10,
      warehouseId = 'wh-main',
      warehouseName = 'Central Logistics Hub',
      costPrice = 0,
      sellingPrice = 0,
      price = 0,
      description = '',
    } = productData;

    // Check duplicate SKU
    const existing = await this.getAllProducts();
    const isDuplicate = existing.some(
      (p) => p.sku.toLowerCase() === sku.trim().toLowerCase()
    );
    if (isDuplicate) {
      const err = new Error(`Product with SKU '${sku}' already exists`);
      err.statusCode = 409;
      throw err;
    }

    const finalPrice = Number(sellingPrice || price || 0);
    const finalStock = Number(currentStock || 0);
    const finalReorder = Number(reorderLevel || 10);
    const finalCost = Number(costPrice || 0);

    const now = new Date().toISOString();
    const newProduct = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category: category.trim(),
      unit: unit.trim(),
      supplier: supplier.trim(),
      currentStock: finalStock,
      reorderLevel: finalReorder,
      warehouseId,
      warehouseName,
      costPrice: finalCost,
      sellingPrice: finalPrice,
      description: description.trim(),
      status: finalStock <= 0 ? 'Out of Stock' : finalStock <= finalReorder ? 'Low Stock' : 'In Stock',
      lastUpdated: now,
    };

    // Try inserting into Supabase
    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([
            {
              id: newProduct.id,
              name: newProduct.name,
              sku: newProduct.sku,
              category: newProduct.category,
              unit: newProduct.unit,
              supplier: newProduct.supplier,
              current_stock: newProduct.currentStock,
              reorder_level: newProduct.reorderLevel,
              warehouse_id: newProduct.warehouseId,
              warehouse_name: newProduct.warehouseName,
              cost_price: newProduct.costPrice,
              selling_price: newProduct.sellingPrice,
              description: newProduct.description,
              created_by: user?.id || null,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          const normalized = this.normalizeProduct(data);
          this.memoryProducts.unshift(normalized);
          return normalized;
        }
      } catch (_err) {
        // Fallback
      }
    }

    this.memoryProducts.unshift(newProduct);
    return newProduct;
  }

  /**
   * PUT /api/products/:id
   */
  async updateProduct(id, updateData) {
    const existing = await this.getProductById(id);
    if (!existing) {
      const err = new Error(`Product with ID '${id}' not found`);
      err.statusCode = 404;
      throw err;
    }

    // Check SKU conflict if sku is changed
    if (updateData.sku && updateData.sku.toLowerCase() !== existing.sku.toLowerCase()) {
      const all = await this.getAllProducts();
      const conflict = all.some(
        (p) => p.id !== existing.id && p.sku.toLowerCase() === updateData.sku.toLowerCase()
      );
      if (conflict) {
        const err = new Error(`Another product with SKU '${updateData.sku}' already exists`);
        err.statusCode = 409;
        throw err;
      }
    }

    const updatedStock = updateData.currentStock !== undefined
      ? Number(updateData.currentStock)
      : existing.currentStock;
    const updatedReorder = updateData.reorderLevel !== undefined
      ? Number(updateData.reorderLevel)
      : existing.reorderLevel;

    const merged = {
      ...existing,
      ...updateData,
      currentStock: updatedStock,
      reorderLevel: updatedReorder,
      lastUpdated: new Date().toISOString(),
    };

    if (merged.currentStock <= 0) {
      merged.status = 'Out of Stock';
    } else if (merged.currentStock <= merged.reorderLevel) {
      merged.status = 'Low Stock';
    } else {
      merged.status = 'In Stock';
    }

    // Try updating Supabase
    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .update({
            name: merged.name,
            sku: merged.sku,
            category: merged.category,
            unit: merged.unit,
            supplier: merged.supplier,
            current_stock: merged.currentStock,
            reorder_level: merged.reorderLevel,
            warehouse_id: merged.warehouseId,
            warehouse_name: merged.warehouseName,
            cost_price: merged.costPrice,
            selling_price: merged.sellingPrice,
            description: merged.description,
            last_updated: merged.lastUpdated,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (!error && data) {
          const normalized = this.normalizeProduct(data);
          this.memoryProducts = this.memoryProducts.map((p) =>
            p.id === existing.id ? normalized : p
          );
          return normalized;
        }
      } catch (_err) {
        // Fallback
      }
    }

    this.memoryProducts = this.memoryProducts.map((p) =>
      p.id === existing.id ? merged : p
    );
    return merged;
  }

  /**
   * DELETE /api/products/:id
   */
  async deleteProduct(id) {
    const existing = await this.getProductById(id);
    if (!existing) {
      const err = new Error(`Product with ID '${id}' not found`);
      err.statusCode = 404;
      throw err;
    }

    // Prevent deletion if product currently has active stock
    if (existing.currentStock > 0) {
      const err = new Error(
        `Cannot delete product '${existing.name}' because it currently has ${existing.currentStock} units in stock. Please adjust stock to 0 before removing.`
      );
      err.statusCode = 400;
      throw err;
    }

    if (this.isSupabaseConfigured()) {
      try {
        await supabase.from('products').delete().eq('id', existing.id);
      } catch (_err) {
        // Fallback
      }
    }

    this.memoryProducts = this.memoryProducts.filter((p) => p.id !== existing.id);
    return { success: true, id: existing.id, name: existing.name };
  }
}

module.exports = new ProductService();
