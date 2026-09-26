import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  Receipt,
  Delivery,
  Transfer,
  Adjustment,
  LedgerEntry,
  Warehouse,
  ProductStatus,
} from '../types/inventory';
import {
  INITIAL_PRODUCTS,
  INITIAL_RECEIPTS,
  INITIAL_DELIVERIES,
  INITIAL_TRANSFERS,
  INITIAL_ADJUSTMENTS,
  INITIAL_LEDGER,
  INITIAL_WAREHOUSES,
} from '../data/mockData';
import {
  productService,
  receiptService,
  deliveryService,
  transferService,
  adjustmentService,
  ledgerService,
  warehouseService,
  productApi,
  receiptApi,
  deliveryApi,
  transferApi,
  adjustmentApi,
} from '../services/api';

interface InventoryContextType {
  products: Product[];
  receipts: Receipt[];
  deliveries: Delivery[];
  transfers: Transfer[];
  adjustments: Adjustment[];
  ledger: LedgerEntry[];
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;

  // Refresh
  refreshData: () => Promise<void>;

  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'lastUpdated' | 'status'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;

  // Receipt actions
  createReceipt: (receipt: Omit<Receipt, 'id' | 'receiptNumber' | 'createdAt' | 'productsCount' | 'totalQuantity'>) => Receipt;
  updateReceiptStatus: (id: string, status: Receipt['status']) => void;
  validateReceiptRpc: (id: string) => Promise<void>;

  // Delivery actions
  createDelivery: (delivery: Omit<Delivery, 'id' | 'deliveryNumber' | 'productsCount' | 'totalQuantity'>) => Delivery;
  advanceDeliveryStatus: (id: string) => void;
  validateDeliveryRpc: (id: string) => Promise<void>;

  // Transfer actions
  createTransfer: (transfer: Omit<Transfer, 'id' | 'transferNumber'>) => Transfer;
  validateTransferRpc: (id: string) => Promise<void>;

  // Adjustment actions
  createAdjustment: (adjustment: Omit<Adjustment, 'id' | 'adjustmentNumber'>) => Adjustment;
  validateAdjustmentRpc: (id: string) => Promise<void>;

  // Stats
  totalProductsCount: number;
  totalStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('stocksense_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('stocksense_receipts');
    return saved ? JSON.parse(saved) : INITIAL_RECEIPTS;
  });

  const [deliveries, setDeliveries] = useState<Delivery[]>(() => {
    const saved = localStorage.getItem('stocksense_deliveries');
    return saved ? JSON.parse(saved) : INITIAL_DELIVERIES;
  });

  const [transfers, setTransfers] = useState<Transfer[]>(() => {
    const saved = localStorage.getItem('stocksense_transfers');
    return saved ? JSON.parse(saved) : INITIAL_TRANSFERS;
  });

  const [adjustments, setAdjustments] = useState<Adjustment[]>(() => {
    const saved = localStorage.getItem('stocksense_adjustments');
    return saved ? JSON.parse(saved) : INITIAL_ADJUSTMENTS;
  });

  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem('stocksense_ledger');
    return saved ? JSON.parse(saved) : INITIAL_LEDGER;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        prods,
        recs,
        dels,
        trfs,
        adjs,
        leds,
        whs,
      ] = await Promise.allSettled([
        productService.getProducts(),
        receiptService.listReceipts(),
        deliveryService.listDeliveries(),
        transferService.listTransfers(),
        adjustmentService.listAdjustments(),
        ledgerService.getMovementHistory(),
        warehouseService.getWarehouses(),
      ]);

      if (prods.status === 'fulfilled' && prods.value.length > 0) {
        setProducts(prods.value);
      }
      if (recs.status === 'fulfilled' && recs.value.length > 0) {
        setReceipts(recs.value);
      }
      if (dels.status === 'fulfilled' && dels.value.length > 0) {
        setDeliveries(dels.value);
      }
      if (trfs.status === 'fulfilled' && trfs.value.length > 0) {
        setTransfers(trfs.value);
      }
      if (adjs.status === 'fulfilled' && adjs.value.length > 0) {
        setAdjustments(adjs.value);
      }
      if (leds.status === 'fulfilled' && leds.value.length > 0) {
        setLedger(leds.value);
      }
      if (whs.status === 'fulfilled' && whs.value.length > 0) {
        setWarehouses(whs.value);
      }
    } catch (err: any) {
      console.warn('[InventoryContext] Live fetch fallback:', err.message || err);
      setError(err.message || 'Failed to sync with live database');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial live data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    localStorage.setItem('stocksense_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('stocksense_receipts', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('stocksense_deliveries', JSON.stringify(deliveries));
  }, [deliveries]);

  useEffect(() => {
    localStorage.setItem('stocksense_transfers', JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem('stocksense_adjustments', JSON.stringify(adjustments));
  }, [adjustments]);

  useEffect(() => {
    localStorage.setItem('stocksense_ledger', JSON.stringify(ledger));
  }, [ledger]);

  const calculateStatus = (stock: number, min: number): ProductStatus => {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= min) return 'Low Stock';
    return 'In Stock';
  };

  const addProduct = (data: Omit<Product, 'id' | 'lastUpdated' | 'status'>): Product => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const status = calculateStatus(data.currentStock, data.reorderLevel);

    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      status,
      lastUpdated: formattedDate,
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Dispatch to database / backend service in background
    productApi.create(data).catch((err) => console.warn('productApi.create sync:', err));

    // Add initial ledger entry if initial stock > 0
    if (data.currentStock > 0) {
      const newLedger: LedgerEntry = {
        id: `led-${Date.now()}`,
        date: formattedDate,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        warehouseId: newProduct.warehouseId,
        warehouseName: newProduct.warehouseName,
        transactionType: 'RECEIPT',
        quantity: data.currentStock,
        reference: 'INITIAL-STOCK',
        createdBy: 'Admin',
        previousStock: 0,
        newStock: data.currentStock,
      };
      setLedger((prev) => [newLedger, ...prev]);
    }

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates, lastUpdated: formattedDate };
          updated.status = calculateStatus(updated.currentStock, updated.reorderLevel);
          return updated;
        }
        return p;
      })
    );

    // Dispatch to database / backend service in background
    productApi.update(id, updates).catch((err) => console.warn('productApi.update sync:', err));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    productApi.delete(id).catch((err) => console.warn('productApi.delete sync:', err));
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find((p) => p.id === id || p.sku === id);
  };

  const createReceipt = (
    data: Omit<Receipt, 'id' | 'receiptNumber' | 'createdAt' | 'productsCount' | 'totalQuantity'>
  ): Receipt => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const receiptNum = `REC-${Math.floor(1000 + Math.random() * 9000)}`;

    const totalQty = data.items.reduce((acc, item) => acc + item.quantity, 0);

    const newReceipt: Receipt = {
      ...data,
      id: `rec-${Date.now()}`,
      receiptNumber: receiptNum,
      productsCount: data.items.length,
      totalQuantity: totalQty,
      createdAt: formattedDate,
    };

    setReceipts((prev) => [newReceipt, ...prev]);
    receiptApi.create(data).catch((err) => console.warn('receiptApi.create sync:', err));
    return newReceipt;
  };

  const updateReceiptStatus = (id: string, newStatus: Receipt['status']) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    receiptApi.updateStatus(id, newStatus).catch((err) => console.warn('receiptApi.updateStatus sync:', err));
  };

  const validateReceiptRpc = async (id: string) => {
    try {
      await receiptService.validateReceipt(id);
      updateReceiptStatus(id, 'Confirmed');
    } catch (err: any) {
      console.warn('validateReceiptRpc error, falling back to status update:', err.message || err);
      updateReceiptStatus(id, 'Confirmed');
    }
  };

  const createDelivery = (
    data: Omit<Delivery, 'id' | 'deliveryNumber' | 'productsCount' | 'totalQuantity'>
  ): Delivery => {
    const deliveryNum = `DEL-2026-${Math.floor(100 + Math.random() * 900)}`;
    const totalQty = data.items.reduce((acc, item) => acc + item.quantity, 0);

    const newDelivery: Delivery = {
      ...data,
      id: `del-${Date.now()}`,
      deliveryNumber: deliveryNum,
      productsCount: data.items.length,
      totalQuantity: totalQty,
    };

    setDeliveries((prev) => [newDelivery, ...prev]);
    deliveryApi.create(data).catch((err) => console.warn('deliveryApi.create sync:', err));
    return newDelivery;
  };

  const advanceDeliveryStatus = (id: string) => {
    const statusOrder: Delivery['status'][] = ['Draft', 'Pick', 'Pack', 'Validate'];
    let nextSt: Delivery['status'] | null = null;
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const currentIndex = statusOrder.indexOf(d.status);
          const nextStatus = currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : d.status;
          nextSt = nextStatus;
          return { ...d, status: nextStatus };
        }
        return d;
      })
    );
    if (nextSt) {
      deliveryApi.updateStatus(id, nextSt).catch((err) => console.warn('deliveryApi.updateStatus sync:', err));
    }
  };

  const validateDeliveryRpc = async (id: string) => {
    try {
      await deliveryService.validateDelivery(id);
      setDeliveries((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'Validate' } : d)));
    } catch (err: any) {
      console.warn('validateDeliveryRpc error, falling back to status update:', err.message || err);
      setDeliveries((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'Validate' } : d)));
    }
  };

  const createTransfer = (transferData: Omit<Transfer, 'id' | 'transferNumber'>): Transfer => {
    const transferNum = `TRF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTransfer: Transfer = {
      ...transferData,
      id: `trf-${Date.now()}`,
      transferNumber: transferNum,
    };

    setTransfers((prev) => [newTransfer, ...prev]);
    transferApi.create(transferData).catch((err) => console.warn('transferApi.create sync:', err));

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newLedgerOut: LedgerEntry = {
      id: `led-${Date.now()}`,
      date: formattedDate,
      productId: transferData.productId,
      productName: transferData.productName,
      sku: transferData.sku,
      warehouseId: transferData.fromWarehouseId,
      warehouseName: transferData.fromWarehouseName,
      transactionType: 'TRANSFER_OUT',
      quantity: -transferData.quantity,
      reference: transferNum,
      createdBy: transferData.createdBy || 'Admin',
    };
    setLedger((prev) => [newLedgerOut, ...prev]);

    return newTransfer;
  };

  const validateTransferRpc = async (id: string) => {
    try {
      await transferService.validateTransfer(id);
      setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'Completed' } : t)));
    } catch (err: any) {
      console.warn('validateTransferRpc error:', err.message || err);
      setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'Completed' } : t)));
    }
  };

  const createAdjustment = (adjData: Omit<Adjustment, 'id' | 'adjustmentNumber'>): Adjustment => {
    const adjNum = `ADJ-${Math.floor(5000 + Math.random() * 5000)}`;

    const newAdjustment: Adjustment = {
      ...adjData,
      id: `adj-${Date.now()}`,
      adjustmentNumber: adjNum,
    };

    setAdjustments((prev) => [newAdjustment, ...prev]);
    adjustmentApi.create(adjData).catch((err) => console.warn('adjustmentApi.create sync:', err));

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newLedger: LedgerEntry = {
      id: `led-${Date.now()}`,
      date: formattedDate,
      productId: adjData.productId,
      productName: adjData.productName,
      sku: adjData.sku,
      warehouseId: adjData.warehouseId,
      warehouseName: adjData.warehouseName,
      transactionType: 'ADJUSTMENT',
      quantity: adjData.difference,
      reference: adjNum,
      createdBy: adjData.createdBy || 'Admin',
    };
    setLedger((prev) => [newLedger, ...prev]);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === adjData.productId) {
          const newQty = adjData.countedQuantity;
          return {
            ...p,
            currentStock: newQty,
            status: calculateStatus(newQty, p.reorderLevel),
            lastUpdated: formattedDate,
          };
        }
        return p;
      })
    );

    return newAdjustment;
  };

  const validateAdjustmentRpc = async (id: string) => {
    try {
      await adjustmentService.validateAdjustment(id);
    } catch (err: any) {
      console.warn('validateAdjustmentRpc error:', err.message || err);
    }
  };

  const totalProductsCount = products.length;
  const totalStockCount = products.reduce((sum, p) => sum + p.currentStock, 0);
  const lowStockCount = products.filter((p) => p.status === 'Low Stock').length;
  const outOfStockCount = products.filter((p) => p.status === 'Out of Stock').length;
  const totalStockValue = products.reduce((sum, p) => sum + p.currentStock * (p.sellingPrice || p.costPrice), 0);

  return (
    <InventoryContext.Provider
      value={{
        products,
        receipts,
        deliveries,
        transfers,
        adjustments,
        ledger,
        warehouses,
        loading,
        error,
        refreshData,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        createReceipt,
        updateReceiptStatus,
        validateReceiptRpc,
        createDelivery,
        advanceDeliveryStatus,
        validateDeliveryRpc,
        createTransfer,
        validateTransferRpc,
        createAdjustment,
        validateAdjustmentRpc,
        totalProductsCount,
        totalStockCount,
        lowStockCount,
        outOfStockCount,
        totalStockValue,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
