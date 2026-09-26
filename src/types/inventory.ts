export type ProductStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  supplier: string;
  currentStock: number;
  reorderLevel: number;
  warehouseId: string;
  warehouseName: string;
  status: ProductStatus;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  lastUpdated: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  warehouseId: string;
  warehouseName: string;
  currentStock: number;
  reorderLevel: number;
  status: ProductStatus;
  lastUpdated: string;
}

export interface ReceiptItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export type ReceiptStatus = 'Draft' | 'Waiting' | 'Confirmed' | 'Cancelled';

export interface Receipt {
  id: string;
  receiptNumber: string;
  supplier: string;
  warehouseId: string;
  warehouseName: string;
  receiptDate: string;
  productsCount: number;
  totalQuantity: number;
  items: ReceiptItem[];
  status: ReceiptStatus;
  createdBy: string;
  notes?: string;
  createdAt: string;
}

export type DeliveryStatus = 'Draft' | 'Pick' | 'Pack' | 'Validate';

export interface DeliveryItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  pickedQuantity: number;
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  customer: string;
  destination: string;
  warehouseId: string;
  warehouseName: string;
  orderDate: string;
  status: DeliveryStatus;
  productsCount: number;
  totalQuantity: number;
  items: DeliveryItem[];
  createdBy: string;
  carrier?: string;
  trackingNumber?: string;
}

export type TransferStatus = 'Pending' | 'In Transit' | 'Completed' | 'Cancelled';

export interface Transfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  status: TransferStatus;
  transferDate: string;
  createdBy: string;
  notes?: string;
}

export type AdjustmentReason = 'Damaged' | 'Lost' | 'Found' | 'Counting Error' | 'Other';

export interface Adjustment {
  id: string;
  adjustmentNumber: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
  reason: AdjustmentReason;
  notes?: string;
  adjustmentDate: string;
  createdBy: string;
}

export type TransactionType = 'RECEIPT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'DELIVERY' | 'ADJUSTMENT';

export interface LedgerEntry {
  id: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  transactionType: TransactionType;
  quantity: number;
  reference: string;
  createdBy: string;
  previousStock?: number;
  newStock?: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  address: string;
  totalProducts: number;
  totalStock: number;
  capacity: number;
  occupancyPercentage: number;
  manager: string;
  contactNumber: string;
  status: 'Active' | 'Maintenance';
}
