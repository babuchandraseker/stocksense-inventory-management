import {
  Product,
  Receipt,
  Delivery,
  Transfer,
  Adjustment,
  LedgerEntry,
  Warehouse,
  ReceiptStatus,
  DeliveryStatus,
  ProductStatus,
} from '../types/inventory';
import { User, LoginCredentials } from '../types/auth';
import {
  INITIAL_PRODUCTS,
  INITIAL_RECEIPTS,
  INITIAL_DELIVERIES,
  INITIAL_TRANSFERS,
  INITIAL_ADJUSTMENTS,
  INITIAL_LEDGER,
  INITIAL_WAREHOUSES,
} from '../data/mockData';
import { MOCK_USERS } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TIMEOUT_MS = 3000;

// Helper function to handle HTTP requests with timeout and fallback
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackHandler: () => T | Promise<T>
): Promise<T> {
  const token = localStorage.getItem('stocksense_token') || 'demo-bearer-token';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // If server returned non-2xx status, we throw or fall back
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (_err) {
    // Graceful offline / demo fallback
    return await fallbackHandler();
  }
}

// Local mock storage helpers
const getStored = <T>(key: string, defaultVal: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setStored = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage error', e);
  }
};

// ==========================================
// 1. AUTH API
// ==========================================
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    return request(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(credentials) },
      () => {
        let user: User;
        if (credentials.role) {
          user = MOCK_USERS[credentials.role];
        } else if (credentials.email.toLowerCase().includes('staff')) {
          user = MOCK_USERS.staff;
        } else {
          user = MOCK_USERS.manager;
        }
        const token = `token_${user.id}_${Date.now()}`;
        localStorage.setItem('stocksense_token', token);
        localStorage.setItem('stocksense_auth_user', JSON.stringify(user));
        return { user, token };
      }
    );
  },

  logout: async (): Promise<void> => {
    return request(
      '/auth/logout',
      { method: 'POST' },
      () => {
        localStorage.removeItem('stocksense_token');
        localStorage.removeItem('stocksense_auth_user');
      }
    );
  },

  getCurrentUser: async (): Promise<User | null> => {
    return request(
      '/auth/me',
      { method: 'GET' },
      () => {
        return getStored<User | null>('stocksense_auth_user', MOCK_USERS.manager);
      }
    );
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    return request(
      '/auth/profile',
      { method: 'PATCH', body: JSON.stringify(data) },
      () => {
        const currentUser = getStored<User>('stocksense_auth_user', MOCK_USERS.manager);
        const updated = { ...currentUser, ...data };
        localStorage.setItem('stocksense_auth_user', JSON.stringify(updated));
        return updated;
      }
    );
  },
};

// ==========================================
// 2. DASHBOARD API
// ==========================================
export const dashboardApi = {
  getManagerStats: async () => {
    return request(
      '/dashboard/manager-stats',
      { method: 'GET' },
      () => {
        const products = getStored<Product[]>('stocksense_products', INITIAL_PRODUCTS);
        const totalProducts = products.length;
        const totalStock = products.reduce((acc, p) => acc + p.currentStock, 0);
        const lowStock = products.filter((p) => p.status === 'Low Stock').length;
        const outOfStock = products.filter((p) => p.status === 'Out of Stock').length;
        const totalValue = products.reduce((acc, p) => acc + p.currentStock * (p.sellingPrice || p.costPrice), 0);

        return {
          totalProducts,
          totalStock,
          lowStock,
          outOfStock,
          totalValue,
        };
      }
    );
  },

  getStaffStats: async () => {
    return request(
      '/dashboard/staff-stats',
      { method: 'GET' },
      () => {
        const products = getStored<Product[]>('stocksense_products', INITIAL_PRODUCTS);
        const receipts = getStored<Receipt[]>('stocksense_receipts', INITIAL_RECEIPTS);
        const ledger = getStored<LedgerEntry[]>('stocksense_ledger', INITIAL_LEDGER);

        const totalStock = products.reduce((acc, p) => acc + p.currentStock, 0);
        const lowStock = products.filter((p) => p.status === 'Low Stock' || p.status === 'Out of Stock').length;
        const todayReceipts = receipts.length;
        const todayActivities = ledger.length;

        return {
          totalStock,
          lowStock,
          todayReceipts,
          todayActivities,
        };
      }
    );
  },

  getInventoryTrends: async () => {
    return request(
      '/dashboard/trends',
      { method: 'GET' },
      () => [
        { month: 'Jan', inStock: 380, inbound: 120, outbound: 80 },
        { month: 'Feb', inStock: 420, inbound: 140, outbound: 95 },
        { month: 'Mar', inStock: 460, inbound: 160, outbound: 110 },
        { month: 'Apr', inStock: 510, inbound: 190, outbound: 130 },
        { month: 'May', inStock: 560, inbound: 210, outbound: 145 },
        { month: 'Jun', inStock: 610, inbound: 240, outbound: 160 },
      ]
    );
  },

  getRecentActivities: async () => {
    return request(
      '/dashboard/recent-activities',
      { method: 'GET' },
      () => {
        const ledger = getStored<LedgerEntry[]>('stocksense_ledger', INITIAL_LEDGER);
        return ledger.slice(0, 10);
      }
    );
  },
};

// ==========================================
// 3. PRODUCT API
// ==========================================
export const productApi = {
  getAll: async (params?: { category?: string; status?: string; search?: string }): Promise<Product[]> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request(
      `/products${query ? `?${query}` : ''}`,
      { method: 'GET' },
      () => {
        let list = getStored<Product[]>('stocksense_products', INITIAL_PRODUCTS);
        if (params?.category && params.category !== 'All') {
          list = list.filter((p) => p.category === params.category);
        }
        if (params?.status && params.status !== 'All') {
          list = list.filter((p) => p.status === params.status);
        }
        if (params?.search) {
          const s = params.search.toLowerCase();
          list = list.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
        }
        return list;
      }
    );
  },

  getById: async (id: string): Promise<Product | null> => {
    return request(
      `/products/${id}`,
      { method: 'GET' },
      () => {
        const list = getStored<Product[]>('stocksense_products', INITIAL_PRODUCTS);
        return list.find((p) => p.id === id || p.sku === id) || null;
      }
    );
  },

  create: async (data: Omit<Product, 'id' | 'lastUpdated' | 'status'>): Promise<Product> => {
    return request(
      '/products',
      { method: 'POST', body: JSON.stringify(data) },
      () => {
        const list = getStored<Product[]>('stocksense_products', INITIAL_PRODUCTS);
        const now = new Date();
        const formattedDate = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        let status: ProductStatus = 'In Stock';
        if (data.currentStock <= 0) status = 'Out of Stock';
        else if (data.currentStock <= data.reorderLevel) status = 'Low Stock';

        const newProd: Product = {
          ...data,
          id: `prod-${Date.now()}`,
          status,
          lastUpdated: formattedDate,
        };

        const updated = [newProd, ...list];
        setStored('stocksense_products', updated);
        return newProd;
      }
    );
  },

  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    return request(
      `/products/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      () => {
        const list = getStored<Product[]>('stocksense_products', INITIAL_PRODUCTS);
        const now = new Date();
        const formattedDate = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        let updatedProd: Product | null = null;
        const updatedList = list.map((p) => {
          if (p.id === id) {
            const merged = { ...p, ...data, lastUpdated: formattedDate };
            if (merged.currentStock <= 0) merged.status = 'Out of Stock';
            else if (merged.currentStock <= merged.reorderLevel) merged.status = 'Low Stock';
            else merged.status = 'In Stock';
            updatedProd = merged;
            return merged;
          }
          return p;
        });

        if (!updatedProd) throw new Error('Product not found');
        setStored('stocksense_products', updatedList);
        return updatedProd;
      }
    );
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return request(
      `/products/${id}`,
      { method: 'DELETE' },
      () => {
        const list = getStored<Product[]>('stocksense_products', INITIAL_PRODUCTS);
        const filtered = list.filter((p) => p.id !== id);
        setStored('stocksense_products', filtered);
        return { success: true };
      }
    );
  },
};

// ==========================================
// 4. INVENTORY API
// ==========================================
export const inventoryApi = {
  getAll: async (params?: { warehouseId?: string; status?: string; search?: string }): Promise<Product[]> => {
    return productApi.getAll(params);
  },

  getSummary: async () => {
    return dashboardApi.getManagerStats();
  },
};

// ==========================================
// 5. RECEIPT API
// ==========================================
export const receiptApi = {
  getAll: async (): Promise<Receipt[]> => {
    return request(
      '/receipts',
      { method: 'GET' },
      () => getStored<Receipt[]>('stocksense_receipts', INITIAL_RECEIPTS)
    );
  },

  getById: async (id: string): Promise<Receipt | null> => {
    return request(
      `/receipts/${id}`,
      { method: 'GET' },
      () => {
        const list = getStored<Receipt[]>('stocksense_receipts', INITIAL_RECEIPTS);
        return list.find((r) => r.id === id) || null;
      }
    );
  },

  create: async (data: Omit<Receipt, 'id' | 'receiptNumber' | 'createdAt' | 'productsCount' | 'totalQuantity'>): Promise<Receipt> => {
    return request(
      '/receipts',
      { method: 'POST', body: JSON.stringify(data) },
      () => {
        const list = getStored<Receipt[]>('stocksense_receipts', INITIAL_RECEIPTS);
        const now = new Date();
        const formattedDate = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const receiptNum = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
        const totalQty = data.items.reduce((acc, item) => acc + item.quantity, 0);

        const newRec: Receipt = {
          ...data,
          id: `rec-${Date.now()}`,
          receiptNumber: receiptNum,
          productsCount: data.items.length,
          totalQuantity: totalQty,
          createdAt: formattedDate,
        };

        setStored('stocksense_receipts', [newRec, ...list]);
        return newRec;
      }
    );
  },

  updateStatus: async (id: string, status: ReceiptStatus): Promise<Receipt> => {
    return request(
      `/receipts/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      () => {
        const list = getStored<Receipt[]>('stocksense_receipts', INITIAL_RECEIPTS);
        let updatedItem: Receipt | null = null;
        const updatedList = list.map((r) => {
          if (r.id === id) {
            updatedItem = { ...r, status };
            return updatedItem;
          }
          return r;
        });

        if (!updatedItem) throw new Error('Receipt not found');
        setStored('stocksense_receipts', updatedList);
        return updatedItem;
      }
    );
  },
};

// ==========================================
// 6. DELIVERY API
// ==========================================
export const deliveryApi = {
  getAll: async (): Promise<Delivery[]> => {
    return request(
      '/deliveries',
      { method: 'GET' },
      () => getStored<Delivery[]>('stocksense_deliveries', INITIAL_DELIVERIES)
    );
  },

  getById: async (id: string): Promise<Delivery | null> => {
    return request(
      `/deliveries/${id}`,
      { method: 'GET' },
      () => {
        const list = getStored<Delivery[]>('stocksense_deliveries', INITIAL_DELIVERIES);
        return list.find((d) => d.id === id) || null;
      }
    );
  },

  create: async (data: Omit<Delivery, 'id' | 'deliveryNumber' | 'productsCount' | 'totalQuantity'>): Promise<Delivery> => {
    return request(
      '/deliveries',
      { method: 'POST', body: JSON.stringify(data) },
      () => {
        const list = getStored<Delivery[]>('stocksense_deliveries', INITIAL_DELIVERIES);
        const deliveryNum = `DEL-2026-${Math.floor(100 + Math.random() * 900)}`;
        const totalQty = data.items.reduce((acc, item) => acc + item.quantity, 0);

        const newDel: Delivery = {
          ...data,
          id: `del-${Date.now()}`,
          deliveryNumber: deliveryNum,
          productsCount: data.items.length,
          totalQuantity: totalQty,
        };

        setStored('stocksense_deliveries', [newDel, ...list]);
        return newDel;
      }
    );
  },

  updateStatus: async (id: string, status: DeliveryStatus): Promise<Delivery> => {
    return request(
      `/deliveries/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      () => {
        const list = getStored<Delivery[]>('stocksense_deliveries', INITIAL_DELIVERIES);
        let updatedItem: Delivery | null = null;
        const updatedList = list.map((d) => {
          if (d.id === id) {
            updatedItem = { ...d, status };
            return updatedItem;
          }
          return d;
        });

        if (!updatedItem) throw new Error('Delivery not found');
        setStored('stocksense_deliveries', updatedList);
        return updatedItem;
      }
    );
  },
};

// ==========================================
// 7. TRANSFER API
// ==========================================
export const transferApi = {
  getAll: async (): Promise<Transfer[]> => {
    return request(
      '/transfers',
      { method: 'GET' },
      () => getStored<Transfer[]>('stocksense_transfers', INITIAL_TRANSFERS)
    );
  },

  getById: async (id: string): Promise<Transfer | null> => {
    return request(
      `/transfers/${id}`,
      { method: 'GET' },
      () => {
        const list = getStored<Transfer[]>('stocksense_transfers', INITIAL_TRANSFERS);
        return list.find((t) => t.id === id) || null;
      }
    );
  },

  create: async (data: Omit<Transfer, 'id' | 'transferNumber'>): Promise<Transfer> => {
    return request(
      '/transfers',
      { method: 'POST', body: JSON.stringify(data) },
      () => {
        const list = getStored<Transfer[]>('stocksense_transfers', INITIAL_TRANSFERS);
        const transferNum = `TRF-${Math.floor(1000 + Math.random() * 9000)}`;

        const newTransfer: Transfer = {
          ...data,
          id: `trf-${Date.now()}`,
          transferNumber: transferNum,
        };

        setStored('stocksense_transfers', [newTransfer, ...list]);
        return newTransfer;
      }
    );
  },
};

// ==========================================
// 8. ADJUSTMENT API
// ==========================================
export const adjustmentApi = {
  getAll: async (): Promise<Adjustment[]> => {
    return request(
      '/adjustments',
      { method: 'GET' },
      () => getStored<Adjustment[]>('stocksense_adjustments', INITIAL_ADJUSTMENTS)
    );
  },

  getById: async (id: string): Promise<Adjustment | null> => {
    return request(
      `/adjustments/${id}`,
      { method: 'GET' },
      () => {
        const list = getStored<Adjustment[]>('stocksense_adjustments', INITIAL_ADJUSTMENTS);
        return list.find((a) => a.id === id) || null;
      }
    );
  },

  create: async (data: Omit<Adjustment, 'id' | 'adjustmentNumber'>): Promise<Adjustment> => {
    return request(
      '/adjustments',
      { method: 'POST', body: JSON.stringify(data) },
      () => {
        const list = getStored<Adjustment[]>('stocksense_adjustments', INITIAL_ADJUSTMENTS);
        const adjNum = `ADJ-${Math.floor(5000 + Math.random() * 5000)}`;

        const newAdj: Adjustment = {
          ...data,
          id: `adj-${Date.now()}`,
          adjustmentNumber: adjNum,
        };

        setStored('stocksense_adjustments', [newAdj, ...list]);
        return newAdj;
      }
    );
  },
};

// ==========================================
// 9. STOCK LEDGER API
// ==========================================
export const ledgerApi = {
  getAll: async (params?: { transactionType?: string; warehouseId?: string; search?: string }): Promise<LedgerEntry[]> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request(
      `/ledger${query ? `?${query}` : ''}`,
      { method: 'GET' },
      () => {
        let list = getStored<LedgerEntry[]>('stocksense_ledger', INITIAL_LEDGER);
        if (params?.transactionType && params.transactionType !== 'All') {
          list = list.filter((l) => l.transactionType === params.transactionType);
        }
        if (params?.warehouseId && params.warehouseId !== 'All') {
          list = list.filter((l) => l.warehouseId === params.warehouseId);
        }
        if (params?.search) {
          const s = params.search.toLowerCase();
          list = list.filter(
            (l) =>
              l.productName.toLowerCase().includes(s) ||
              l.sku.toLowerCase().includes(s) ||
              l.reference.toLowerCase().includes(s)
          );
        }
        return list;
      }
    );
  },
};

// ==========================================
// 10. WAREHOUSE API
// ==========================================
export const warehouseApi = {
  getAll: async (): Promise<Warehouse[]> => {
    return request(
      '/warehouses',
      { method: 'GET' },
      () => getStored<Warehouse[]>('stocksense_warehouses', INITIAL_WAREHOUSES)
    );
  },

  getById: async (id: string): Promise<Warehouse | null> => {
    return request(
      `/warehouses/${id}`,
      { method: 'GET' },
      () => {
        const list = getStored<Warehouse[]>('stocksense_warehouses', INITIAL_WAREHOUSES);
        return list.find((w) => w.id === id) || null;
      }
    );
  },
};

export default {
  auth: authApi,
  dashboard: dashboardApi,
  product: productApi,
  inventory: inventoryApi,
  receipt: receiptApi,
  delivery: deliveryApi,
  transfer: transferApi,
  adjustment: adjustmentApi,
  ledger: ledgerApi,
  warehouse: warehouseApi,
};
