import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Receipt,
  Delivery,
  Transfer,
  Adjustment,
  LedgerEntry,
  Warehouse,
  LocationItem,
  LocationStock,
  ProductStatus,
  ReceiptStatus,
  DeliveryStatus,
} from '../types/inventory';
import {
  INITIAL_PRODUCTS,
  INITIAL_WAREHOUSES,
  INITIAL_LOCATIONS,
  INITIAL_LOCATION_STOCKS,
  INITIAL_RECEIPTS,
  INITIAL_DELIVERIES,
  INITIAL_TRANSFERS,
  INITIAL_ADJUSTMENTS,
  INITIAL_LEDGER,
} from '../data/mockData';
import {
  productApi,
  receiptApi,
  deliveryApi,
  transferApi,
  adjustmentApi,
} from '../services/api';

interface StockSummaryItem {
  product: string;
  sku: string;
  quantity: number;
  category: string;
  unit: string;
}

interface InventoryContextType {
  products: Product[];
  warehouses: Warehouse[];
  locations: LocationItem[];
  locationStocks: LocationStock[];
  receipts: Receipt[];
  deliveries: Delivery[];
  transfers: Transfer[];
  adjustments: Adjustment[];
  ledger: LedgerEntry[];

  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'lastUpdated' | 'status'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;

  // Location & Stock helpers
  getLocationStocksForProduct: (productId: string) => LocationStock[];

  // Receipt actions
  createReceipt: (receipt: Omit<Receipt, 'id' | 'receiptNumber' | 'createdAt' | 'productsCount' | 'totalQuantity'>) => Receipt;
  updateReceiptStatus: (id: string, status: ReceiptStatus) => void;

  // Delivery actions
  createDelivery: (delivery: Omit<Delivery, 'id' | 'deliveryNumber' | 'productsCount' | 'totalQuantity'>) => Delivery;
  advanceDeliveryStatus: (id: string) => void;

  // Transfer actions
  createTransfer: (transfer: Omit<Transfer, 'id' | 'transferNumber'>) => Transfer;

  // Adjustment actions
  createAdjustment: (adjustment: Omit<Adjustment, 'id' | 'adjustmentNumber'>) => Adjustment;

  // Dynamic KPIs
  totalProductsCount: number;
  totalStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
  pendingReceiptsCount: number;
  pendingDeliveriesCount: number;
  scheduledTransfersCount: number;

  // Graph datasets
  stockSummary: StockSummaryItem[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_VERSION = 'v2_stocksense_problem_statement';

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear old unrelated localstorage data if from v1
  useEffect(() => {
    const currentVersion = localStorage.getItem('stocksense_data_version');
    if (currentVersion !== STORAGE_VERSION) {
      localStorage.removeItem('stocksense_products');
      localStorage.removeItem('stocksense_receipts');
      localStorage.removeItem('stocksense_deliveries');
      localStorage.removeItem('stocksense_transfers');
      localStorage.removeItem('stocksense_adjustments');
      localStorage.removeItem('stocksense_ledger');
      localStorage.removeItem('stocksense_location_stocks');
      localStorage.setItem('stocksense_data_version', STORAGE_VERSION);
    }
  }, []);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('stocksense_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure no old products persist
        if (parsed.some((p: Product) => p.name === 'iPhone 15' || p.category === 'Electronics')) {
          return INITIAL_PRODUCTS;
        }
        return parsed;
      } catch {
        return INITIAL_PRODUCTS;
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [warehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [locations] = useState<LocationItem[]>(INITIAL_LOCATIONS);

  const [locationStocks, setLocationStocks] = useState<LocationStock[]>(() => {
    const saved = localStorage.getItem('stocksense_location_stocks');
    return saved ? JSON.parse(saved) : INITIAL_LOCATION_STOCKS;
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('stocksense_receipts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.some((r: Receipt) => r.supplier.includes('Electronics'))) {
          return INITIAL_RECEIPTS;
        }
        return parsed;
      } catch {
        return INITIAL_RECEIPTS;
      }
    }
    return INITIAL_RECEIPTS;
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

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('stocksense_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('stocksense_location_stocks', JSON.stringify(locationStocks));
  }, [locationStocks]);

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

  const getLocationStocksForProduct = (productId: string): LocationStock[] => {
    return locationStocks.filter((ls) => ls.productId === productId);
  };

  // 1. ADD PRODUCT
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

    // Create default location stock in Main Warehouse
    if (data.currentStock > 0) {
      const newLocStock: LocationStock = {
        id: `ls-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        warehouseId: data.warehouseId || 'wh-main',
        warehouseName: data.warehouseName || 'Main Warehouse',
        locationId: 'loc-main-wh',
        locationName: 'Main Warehouse',
        quantity: data.currentStock,
        unit: data.unit,
      };
      setLocationStocks((prev) => [...prev, newLocStock]);

      const newLedger: LedgerEntry = {
        id: `led-${Date.now()}`,
        date: formattedDate,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        warehouseId: data.warehouseId || 'wh-main',
        warehouseName: data.warehouseName || 'Main Warehouse',
        locationName: 'Main Warehouse',
        transactionType: 'INITIAL_STOCK',
        quantity: data.currentStock,
        reference: `INIT-${newProduct.sku}`,
        createdBy: 'Admin',
        previousStock: 0,
        newStock: data.currentStock,
        notes: 'Initial stock intake',
      };
      setLedger((prev) => [newLedger, ...prev]);
    }

    productApi.create(data).catch(() => {});
    return newProduct;
  };

  // 2. UPDATE PRODUCT
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

    productApi.update(id, updates).catch(() => {});
  };

  // 3. DELETE PRODUCT
  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setLocationStocks((prev) => prev.filter((ls) => ls.productId !== id));
    productApi.delete(id).catch(() => {});
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find((p) => p.id === id || p.sku === id);
  };

  // 4. CREATE RECEIPT
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

    // If receipt is created directly as Confirmed, immediately apply stock & ledger
    if (data.status === 'Confirmed') {
      data.items.forEach((item) => {
        applyReceiptStockIncrease(item.productId, item.quantity, data.warehouseId, data.warehouseName, data.locationName || 'Main Warehouse', receiptNum, data.createdBy);
      });
    }

    receiptApi.create(data).catch(() => {});
    return newReceipt;
  };

  // Helper for Receipt Stock Increase
  const applyReceiptStockIncrease = (
    productId: string,
    quantity: number,
    warehouseId: string,
    warehouseName: string,
    locationName: string,
    reference: string,
    createdBy: string
  ) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // 1. Update Product Total Stock
    let previousStock = 0;
    let newStock = 0;
    let pName = '';
    let pSku = '';

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId || p.name === productId || p.sku === productId) {
          previousStock = p.currentStock;
          newStock = p.currentStock + quantity;
          pName = p.name;
          pSku = p.sku;
          return {
            ...p,
            currentStock: newStock,
            status: calculateStatus(newStock, p.reorderLevel),
            lastUpdated: formattedDate,
          };
        }
        return p;
      })
    );

    // 2. Update Location Stock
    setLocationStocks((prev) => {
      const targetLoc = locationName || 'Main Warehouse';
      const existing = prev.find(
        (ls) =>
          (ls.productId === productId || ls.productName === pName) &&
          ls.locationName.toLowerCase() === targetLoc.toLowerCase()
      );

      if (existing) {
        return prev.map((ls) =>
          ls.id === existing.id ? { ...ls, quantity: ls.quantity + quantity } : ls
        );
      } else {
        const newLs: LocationStock = {
          id: `ls-${Date.now()}-${Math.random()}`,
          productId,
          productName: pName || 'Product',
          sku: pSku || 'SKU',
          warehouseId: warehouseId || 'wh-main',
          warehouseName: warehouseName || 'Main Warehouse',
          locationId: `loc-${Date.now()}`,
          locationName: targetLoc,
          quantity,
          unit: 'kg',
        };
        return [...prev, newLs];
      }
    });

    // 3. Create Stock Ledger entry
    const newLedger: LedgerEntry = {
      id: `led-${Date.now()}-${Math.random()}`,
      date: formattedDate,
      productId,
      productName: pName || 'Product',
      sku: pSku || 'SKU',
      warehouseId: warehouseId || 'wh-main',
      warehouseName: warehouseName || 'Main Warehouse',
      locationName: locationName || 'Main Warehouse',
      transactionType: 'RECEIPT',
      quantity,
      reference,
      createdBy: createdBy || 'Admin',
      previousStock,
      newStock,
      notes: `Consignment intake +${quantity}`,
    };
    setLedger((prev) => [newLedger, ...prev]);
  };

  // 5. UPDATE RECEIPT STATUS
  const updateReceiptStatus = (id: string, newStatus: ReceiptStatus) => {
    const target = receipts.find((r) => r.id === id);
    if (target && target.status !== 'Confirmed' && newStatus === 'Confirmed') {
      // Transitioning to Confirmed -> Apply Stock & Ledger
      target.items.forEach((item) => {
        applyReceiptStockIncrease(
          item.productId,
          item.quantity,
          target.warehouseId,
          target.warehouseName,
          target.locationName || 'Main Warehouse',
          target.receiptNumber,
          target.createdBy
        );
      });
    }

    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    receiptApi.updateStatus(id, newStatus).catch(() => {});
  };

  // 6. CREATE DELIVERY
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

    // If created directly in Validate status
    if (data.status === 'Validate') {
      data.items.forEach((item) => {
        applyDeliveryStockDecrease(
          item.productId,
          item.quantity,
          data.warehouseId,
          data.warehouseName,
          data.locationName || 'Main Warehouse',
          deliveryNum,
          data.createdBy
        );
      });
    }

    deliveryApi.create(data).catch(() => {});
    return newDelivery;
  };

  // Helper for Delivery Stock Decrease
  const applyDeliveryStockDecrease = (
    productId: string,
    quantity: number,
    warehouseId: string,
    warehouseName: string,
    locationName: string,
    reference: string,
    createdBy: string
  ) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    let previousStock = 0;
    let newStock = 0;
    let pName = '';
    let pSku = '';

    // 1. Update Product Total Stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId || p.name === productId || p.sku === productId) {
          previousStock = p.currentStock;
          newStock = Math.max(0, p.currentStock - quantity);
          pName = p.name;
          pSku = p.sku;
          return {
            ...p,
            currentStock: newStock,
            status: calculateStatus(newStock, p.reorderLevel),
            lastUpdated: formattedDate,
          };
        }
        return p;
      })
    );

    // 2. Update Location Stock
    setLocationStocks((prev) => {
      const targetLoc = locationName || 'Main Warehouse';
      return prev.map((ls) => {
        if (
          (ls.productId === productId || ls.productName === pName) &&
          ls.locationName.toLowerCase() === targetLoc.toLowerCase()
        ) {
          return { ...ls, quantity: Math.max(0, ls.quantity - quantity) };
        }
        return ls;
      });
    });

    // 3. Create Stock Ledger entry
    const newLedger: LedgerEntry = {
      id: `led-${Date.now()}-${Math.random()}`,
      date: formattedDate,
      productId,
      productName: pName || 'Product',
      sku: pSku || 'SKU',
      warehouseId: warehouseId || 'wh-main',
      warehouseName: warehouseName || 'Main Warehouse',
      locationName: locationName || 'Main Warehouse',
      transactionType: 'DELIVERY',
      quantity: -quantity,
      reference,
      createdBy: createdBy || 'Staff',
      previousStock,
      newStock,
      notes: `Customer Order fulfillment -${quantity}`,
    };
    setLedger((prev) => [newLedger, ...prev]);
  };

  // 7. ADVANCE DELIVERY STATUS
  const advanceDeliveryStatus = (id: string) => {
    const statusOrder: DeliveryStatus[] = ['Draft', 'Pick', 'Pack', 'Validate'];
    let nextStatus: DeliveryStatus | null = null;
    let deliveryToUpdate: Delivery | null = null;

    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const currentIndex = statusOrder.indexOf(d.status);
          nextStatus = currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : d.status;
          deliveryToUpdate = d;
          return { ...d, status: nextStatus };
        }
        return d;
      })
    );

    if (nextStatus === 'Validate' && deliveryToUpdate) {
      const d = deliveryToUpdate as Delivery;
      d.items.forEach((item) => {
        applyDeliveryStockDecrease(
          item.productId,
          item.quantity,
          d.warehouseId,
          d.warehouseName,
          d.locationName || 'Main Warehouse',
          d.deliveryNumber,
          d.createdBy
        );
      });
    }

    if (nextStatus) {
      deliveryApi.updateStatus(id, nextStatus).catch(() => {});
    }
  };

  // 8. CREATE INTERNAL TRANSFER
  // Crucial Rule: TOTAL COMPANY STOCK REMAINS UNCHANGED!
  const createTransfer = (transferData: Omit<Transfer, 'id' | 'transferNumber'>): Transfer => {
    const transferNum = `TRF-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newTransfer: Transfer = {
      ...transferData,
      id: `trf-${Date.now()}`,
      transferNumber: transferNum,
    };

    setTransfers((prev) => [newTransfer, ...prev]);

    // Update location stocks: Source decreases, Destination increases
    const fromLoc = transferData.fromLocationName || 'Main Warehouse';
    const toLoc = transferData.toLocationName || transferData.toWarehouseName || 'Production Floor';

    setLocationStocks((prev) => {
      let foundDest = false;
      const updated = prev.map((ls) => {
        if (
          (ls.productId === transferData.productId || ls.sku === transferData.sku) &&
          ls.locationName.toLowerCase() === fromLoc.toLowerCase()
        ) {
          return { ...ls, quantity: Math.max(0, ls.quantity - transferData.quantity) };
        }
        if (
          (ls.productId === transferData.productId || ls.sku === transferData.sku) &&
          ls.locationName.toLowerCase() === toLoc.toLowerCase()
        ) {
          foundDest = true;
          return { ...ls, quantity: ls.quantity + transferData.quantity };
        }
        return ls;
      });

      if (!foundDest) {
        updated.push({
          id: `ls-${Date.now()}`,
          productId: transferData.productId,
          productName: transferData.productName,
          sku: transferData.sku,
          warehouseId: transferData.toWarehouseId || 'wh-main',
          warehouseName: transferData.toWarehouseName || 'Main Warehouse',
          locationId: transferData.toLocationId || `loc-${Date.now()}`,
          locationName: toLoc,
          quantity: transferData.quantity,
          unit: 'kg',
        });
      }

      return updated;
    });

    // Create 2 ledger records: TRANSFER_OUT (-qty) and TRANSFER_IN (+qty)
    const ledgerOut: LedgerEntry = {
      id: `led-${Date.now()}-out`,
      date: formattedDate,
      productId: transferData.productId,
      productName: transferData.productName,
      sku: transferData.sku,
      warehouseId: transferData.fromWarehouseId,
      warehouseName: transferData.fromWarehouseName,
      locationName: fromLoc,
      transactionType: 'TRANSFER_OUT',
      quantity: -transferData.quantity,
      reference: transferNum,
      createdBy: transferData.createdBy || 'Admin',
      notes: `Transfer out to ${toLoc}`,
    };

    const ledgerIn: LedgerEntry = {
      id: `led-${Date.now()}-in`,
      date: formattedDate,
      productId: transferData.productId,
      productName: transferData.productName,
      sku: transferData.sku,
      warehouseId: transferData.toWarehouseId,
      warehouseName: transferData.toWarehouseName,
      locationName: toLoc,
      transactionType: 'TRANSFER_IN',
      quantity: transferData.quantity,
      reference: transferNum,
      createdBy: transferData.createdBy || 'Admin',
      notes: `Transfer in from ${fromLoc}`,
    };

    setLedger((prev) => [ledgerOut, ledgerIn, ...prev]);

    transferApi.create(transferData).catch(() => {});
    return newTransfer;
  };

  // 9. CREATE ADJUSTMENT
  const createAdjustment = (adjData: Omit<Adjustment, 'id' | 'adjustmentNumber'>): Adjustment => {
    const adjNum = `ADJ-${Math.floor(5000 + Math.random() * 5000)}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newAdjustment: Adjustment = {
      ...adjData,
      id: `adj-${Date.now()}`,
      adjustmentNumber: adjNum,
    };

    setAdjustments((prev) => [newAdjustment, ...prev]);

    // 1. Update Product Current Stock by diff
    let prevTotalStock = 0;
    let newTotalStock = 0;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === adjData.productId || p.sku === adjData.sku) {
          prevTotalStock = p.currentStock;
          newTotalStock = Math.max(0, p.currentStock + adjData.difference);
          return {
            ...p,
            currentStock: newTotalStock,
            status: calculateStatus(newTotalStock, p.reorderLevel),
            lastUpdated: formattedDate,
          };
        }
        return p;
      })
    );

    // 2. Update Location Stock
    const targetLoc = adjData.locationName || 'Main Warehouse';
    setLocationStocks((prev) =>
      prev.map((ls) => {
        if (
          (ls.productId === adjData.productId || ls.sku === adjData.sku) &&
          ls.locationName.toLowerCase() === targetLoc.toLowerCase()
        ) {
          return {
            ...ls,
            quantity: Math.max(0, ls.quantity + adjData.difference),
          };
        }
        return ls;
      })
    );

    // 3. Add to Ledger
    const newLedger: LedgerEntry = {
      id: `led-${Date.now()}`,
      date: formattedDate,
      productId: adjData.productId,
      productName: adjData.productName,
      sku: adjData.sku,
      warehouseId: adjData.warehouseId,
      warehouseName: adjData.warehouseName,
      locationName: targetLoc,
      transactionType: 'ADJUSTMENT',
      quantity: adjData.difference,
      reference: adjNum,
      createdBy: adjData.createdBy || 'Admin',
      previousStock: prevTotalStock,
      newStock: newTotalStock,
      notes: `Adjustment (${adjData.reason}): ${adjData.difference > 0 ? '+' : ''}${adjData.difference}`,
    };
    setLedger((prev) => [newLedger, ...prev]);

    adjustmentApi.create(adjData).catch(() => {});
    return newAdjustment;
  };

  // Dynamic KPIs
  const totalProductsCount = products.filter((p) => p.currentStock > 0).length;
  const totalStockCount = products.reduce((sum, p) => sum + p.currentStock, 0);
  const lowStockCount = products.filter((p) => p.currentStock <= p.reorderLevel && p.currentStock > 0).length;
  const outOfStockCount = products.filter((p) => p.currentStock === 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + p.currentStock * (p.sellingPrice || p.costPrice), 0);

  const pendingReceiptsCount = receipts.filter((r) => r.status !== 'Confirmed' && r.status !== 'Cancelled').length;
  const pendingDeliveriesCount = deliveries.filter((d) => d.status !== 'Validate').length;
  const scheduledTransfersCount = transfers.filter((t) => t.status === 'Pending' || t.status === 'In Transit').length;

  // Real-time Stock Summary for Graphs
  const stockSummary: StockSummaryItem[] = products.map((p) => ({
    product: p.name,
    sku: p.sku,
    quantity: p.currentStock,
    category: p.category,
    unit: p.unit,
  }));

  return (
    <InventoryContext.Provider
      value={{
        products,
        warehouses,
        locations,
        locationStocks,
        receipts,
        deliveries,
        transfers,
        adjustments,
        ledger,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        getLocationStocksForProduct,
        createReceipt,
        updateReceiptStatus,
        createDelivery,
        advanceDeliveryStatus,
        createTransfer,
        createAdjustment,
        totalProductsCount,
        totalStockCount,
        lowStockCount,
        outOfStockCount,
        totalStockValue,
        pendingReceiptsCount,
        pendingDeliveriesCount,
        scheduledTransfersCount,
        stockSummary,
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
