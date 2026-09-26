const supabase = require('../config/supabase');

// Default initial fallback catalog matching StockSense official problem statement
const SEED_PRODUCTS = [
  {
    id: 'prod-01',
    name: 'Steel Rods',
    sku: 'STL-ROD-001',
    category: 'Raw Materials',
    unit: 'kg',
    supplier: 'ABC Steel Supplier',
    currentStock: 500,
    reorderLevel: 100,
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    status: 'In Stock',
    costPrice: 45,
    sellingPrice: 65,
    description: 'High-tensile structural steel rods for industrial and fabrication use.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prod-02',
    name: 'Steel',
    sku: 'STL-001',
    category: 'Raw Materials',
    unit: 'kg',
    supplier: 'National Steel Corp',
    currentStock: 300,
    reorderLevel: 75,
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    status: 'In Stock',
    costPrice: 50,
    sellingPrice: 70,
    description: 'Standard grade hot-rolled steel plates and raw sheets.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prod-03',
    name: 'Chairs',
    sku: 'CHR-001',
    category: 'Finished Goods',
    unit: 'units',
    supplier: 'Apex Manufacturing',
    currentStock: 100,
    reorderLevel: 20,
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    status: 'In Stock',
    costPrice: 800,
    sellingPrice: 1200,
    description: 'Assembled ergonomic industrial steel frame chairs.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prod-04',
    name: 'Steel Frames',
    sku: 'STF-001',
    category: 'Finished Goods',
    unit: 'units',
    supplier: 'Apex Manufacturing',
    currentStock: 50,
    reorderLevel: 10,
    warehouseId: 'wh-main',
    warehouseName: 'Main Warehouse',
    status: 'In Stock',
    costPrice: 400,
    sellingPrice: 650,
    description: 'Welded steel structural chair and desk sub-frames.',
    lastUpdated: new Date().toISOString(),
  },
];

class ProductService {
  constructor() {
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
      category: p.category || 'Raw Materials',
      unit: p.unit || 'kg',
      supplier: p.supplier || 'N/A',
      currentStock,
      reorderLevel,
      warehouseId: p.warehouseId || p.warehouse_id || 'wh-main',
      warehouseName: p.warehouseName || p.warehouse_name || 'Main Warehouse',
      status,
      description: p.description || '',
      costPrice: Number(p.costPrice ?? p.cost_price ?? 0),
      sellingPrice: Number(p.sellingPrice ?? p.selling_price ?? p.price ?? 0),
      lastUpdated: p.lastUpdated || p.last_updated || p.updated_at || new Date().toISOString(),
    };
  }

  async getAllProducts(filters = {}) {
    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          let results = data.map((p) => this.normalizeProduct(p));
          if (filters.category && filters.category !== 'All') {
            results = results.filter((p) => p.category.toLowerCase() === filters.category.toLowerCase());
          }
          if (filters.search) {
            const s = filters.search.toLowerCase();
            results = results.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
          }
          return results;
        }
      } catch (err) {
        console.warn('Supabase getAllProducts fallback:', err.message);
      }
    }

    let list = [...this.memoryProducts];
    if (filters.category && filters.category !== 'All') {
      list = list.filter((p) => p.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    }
    return list;
  }

  async getProductById(id) {
    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`id.eq.${id},sku.eq.${id}`)
          .single();
        if (!error && data) return this.normalizeProduct(data);
      } catch (err) {
        console.warn('Supabase getProductById fallback:', err.message);
      }
    }

    return (
      this.memoryProducts.find((p) => p.id === String(id) || p.sku === String(id)) ||
      null
    );
  }

  async createProduct(data) {
    const stock = Number(data.currentStock || data.initialStock || 0);
    const reorder = Number(data.reorderLevel || 10);
    let status = 'In Stock';
    if (stock <= 0) status = 'Out of Stock';
    else if (stock <= reorder) status = 'Low Stock';

    const newProd = {
      id: `prod-${Date.now()}`,
      name: data.name,
      sku: data.sku,
      category: data.category || 'Raw Materials',
      unit: data.unit || 'kg',
      supplier: data.supplier || 'N/A',
      currentStock: stock,
      reorderLevel: reorder,
      warehouseId: data.warehouseId || 'wh-main',
      warehouseName: data.warehouseName || 'Main Warehouse',
      status,
      costPrice: Number(data.costPrice || 0),
      sellingPrice: Number(data.sellingPrice || 0),
      description: data.description || '',
      lastUpdated: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      try {
        const { data: dbData, error } = await supabase
          .from('products')
          .insert([
            {
              name: newProd.name,
              sku: newProd.sku,
              category_id: data.categoryId || null,
              unit_of_measure: newProd.unit,
            },
          ])
          .select()
          .single();
        if (!error && dbData) return this.normalizeProduct(dbData);
      } catch (err) {
        console.warn('Supabase createProduct fallback:', err.message);
      }
    }

    this.memoryProducts.unshift(newProd);
    return newProd;
  }

  async updateProduct(id, data) {
    const existing = await this.getProductById(id);
    if (!existing) throw new Error('Product not found');

    const updated = {
      ...existing,
      ...data,
      lastUpdated: new Date().toISOString(),
    };

    if (data.currentStock !== undefined || data.reorderLevel !== undefined) {
      const stock = Number(updated.currentStock);
      const reorder = Number(updated.reorderLevel);
      if (stock <= 0) updated.status = 'Out of Stock';
      else if (stock <= reorder) updated.status = 'Low Stock';
      else updated.status = 'In Stock';
    }

    this.memoryProducts = this.memoryProducts.map((p) =>
      p.id === existing.id ? updated : p
    );

    return updated;
  }

  async deleteProduct(id) {
    this.memoryProducts = this.memoryProducts.filter((p) => p.id !== String(id) && p.sku !== String(id));
    return { success: true };
  }
}

module.exports = new ProductService();
