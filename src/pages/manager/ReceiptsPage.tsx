import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { FilterBar } from '../../components/common/FilterBar';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge, BadgeVariant } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';
import { Receipt, ReceiptStatus, ReceiptItem } from '../../types/inventory';
import {
  FileText,
  Plus,
  Eye,
  CheckCircle,
  Trash2,
  Building2,
} from 'lucide-react';

export const ReceiptsPage: React.FC = () => {
  const { receipts, createReceipt, updateReceiptStatus, products, warehouses } = useInventory();
  const { showToast } = useToast();

  const [searchValue, setSearchValue] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);

  // Create Form State
  const [supplier, setSupplier] = useState('ABC Steel Supplier');
  const [warehouseId, setWarehouseId] = useState('wh-main');
  const [receiptDate, setReceiptDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([
    {
      productId: products[0]?.id || 'prod-01',
      productName: products[0]?.name || 'Steel Rods',
      sku: products[0]?.sku || 'STL-ROD-001',
      quantity: 100,
      unit: 'kg',
      unitPrice: 45,
      totalPrice: 4500,
    },
  ]);

  const suppliersList = ['ABC Steel Supplier', 'National Steel Corp', 'Apex Manufacturing'];

  // Line Item Management
  const handleAddItem = () => {
    const defaultProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: defaultProd?.id || '',
        productName: defaultProd?.name || 'Product',
        sku: defaultProd?.sku || '',
        quantity: 5,
        unit: 'Units',
        unitPrice: defaultProd?.costPrice || 1000,
        totalPrice: (defaultProd?.costPrice || 1000) * 5,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const selectedProd = products.find((p) => p.id === prodId);
    if (!selectedProd) return;

    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const qty = item.quantity || 1;
          return {
            ...item,
            productId: selectedProd.id,
            productName: selectedProd.name,
            sku: selectedProd.sku,
            unitPrice: selectedProd.costPrice,
            totalPrice: selectedProd.costPrice * qty,
          };
        }
        return item;
      })
    );
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const validQty = Math.max(1, qty);
          return {
            ...item,
            quantity: validQty,
            totalPrice: item.unitPrice * validQty,
          };
        }
        return item;
      })
    );
  };

  const totalReceiptCost = useMemo(() => {
    return items.reduce((acc, it) => acc + it.totalPrice, 0);
  }, [items]);

  const handleSaveReceipt = (status: ReceiptStatus) => {
    const targetWarehouse = warehouses.find((w) => w.id === warehouseId) || warehouses[0];

    const newReceipt = createReceipt({
      supplier,
      warehouseId: targetWarehouse.id,
      warehouseName: targetWarehouse.name,
      receiptDate,
      items,
      status,
      createdBy: 'Admin',
      notes,
    });

    showToast({
      type: 'success',
      title: status === 'Confirmed' ? 'Receipt Confirmed' : 'Receipt Draft Saved',
      message: `${newReceipt.receiptNumber} (${newReceipt.totalQuantity} units) has been recorded.`,
    });

    setIsCreateModalOpen(false);
  };

  const handleConfirmDirectly = () => {
    if (!activeReceipt) return;
    updateReceiptStatus(activeReceipt.id, 'Confirmed');
    showToast({
      type: 'success',
      title: 'Receipt Confirmed',
      message: `Inbound consignment ${activeReceipt.receiptNumber} verified and stock updated.`,
    });
    setIsConfirmModalOpen(false);
    setIsDetailsModalOpen(false);
  };

  // Filtered List
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchesSearch =
        r.receiptNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
        r.supplier.toLowerCase().includes(searchValue.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
      const matchesWarehouse = selectedWarehouse === 'all' || r.warehouseId === selectedWarehouse;

      return matchesSearch && matchesStatus && matchesWarehouse;
    });
  }, [receipts, searchValue, selectedStatus, selectedWarehouse]);

  const totalPages = Math.ceil(filteredReceipts.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReceipts.slice(start, start + pageSize);
  }, [filteredReceipts, currentPage, pageSize]);

  const getStatusBadge = (status: ReceiptStatus) => {
    const map: Record<ReceiptStatus, { variant: BadgeVariant; text: string }> = {
      Draft: { variant: 'neutral', text: 'Draft' },
      Waiting: { variant: 'warning', text: 'Waiting' },
      Confirmed: { variant: 'success', text: 'Confirmed' },
      Cancelled: { variant: 'danger', text: 'Cancelled' },
    };
    const s = map[status] || { variant: 'neutral', text: status };
    return <Badge variant={s.variant} size="sm" dot>{s.text}</Badge>;
  };

  const columns: Column<Receipt>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt ID',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-cream flex items-center justify-center text-brand-caramel">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-brand-textDark text-xs">{item.receiptNumber}</span>
        </div>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (item) => <span className="text-xs font-semibold text-brand-textDark">{item.supplier}</span>,
    },
    {
      key: 'warehouseName',
      header: 'Warehouse',
      render: (item) => (
        <span className="text-xs text-brand-textMuted flex items-center gap-1">
          <Building2 className="w-3 h-3 text-brand-caramel" />
          {item.warehouseName}
        </span>
      ),
    },
    {
      key: 'receiptDate',
      header: 'Date',
      render: (item) => <span className="text-xs text-brand-textMuted">{item.receiptDate}</span>,
    },
    {
      key: 'productsCount',
      header: 'Products',
      align: 'center',
      render: (item) => <span className="text-xs font-bold text-brand-textDark">{item.productsCount} SKUs</span>,
    },
    {
      key: 'totalQuantity',
      header: 'Quantity',
      align: 'center',
      render: (item) => (
        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          +{item.totalQuantity} Units
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      render: (item) => <span className="text-xs text-brand-textMuted">{item.createdBy}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setActiveReceipt(item);
              setIsDetailsModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-brand-textMuted hover:text-brand-textDark hover:bg-brand-cream transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {item.status !== 'Confirmed' && item.status !== 'Cancelled' && (
            <button
              onClick={() => {
                setActiveReceipt(item);
                setIsConfirmModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
              title="Confirm Receipt"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Inbound Receipts"
        subtitle="Track supplier consignments, purchase order receipts, and stock intakes."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setItems([
                {
                  productId: products[0]?.id || 'prod-01',
                  productName: products[0]?.name || 'Steel Rods',
                  sku: products[0]?.sku || 'STL-ROD-001',
                  quantity: 100,
                  unit: 'kg',
                  unitPrice: 45,
                  totalPrice: 4500,
                },
              ]);
              setIsCreateModalOpen(true);
            }}
          >
            Create Receipt
          </Button>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search receipts by ID, supplier..."
        filters={[
          {
            id: 'status',
            value: selectedStatus,
            onChange: setSelectedStatus,
            placeholder: 'All Statuses',
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Waiting', label: 'Waiting' },
              { value: 'Confirmed', label: 'Confirmed' },
              { value: 'Cancelled', label: 'Cancelled' },
            ],
          },
          {
            id: 'warehouse',
            value: selectedWarehouse,
            onChange: setSelectedWarehouse,
            placeholder: 'All Warehouses',
            options: [
              { value: 'all', label: 'All Warehouses' },
              ...warehouses.map((w) => ({ value: w.id, label: w.name })),
            ],
          },
        ]}
        onResetFilters={() => {
          setSearchValue('');
          setSelectedStatus('all');
          setSelectedWarehouse('all');
        }}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredReceipts.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      />

      {/* CREATE RECEIPT MODAL (Matches Approved Reference Design) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Receipt"
        description="Record products received from supplier."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Supplier *"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              options={suppliersList.map((s) => ({ value: s, label: s }))}
            />
            <Select
              label="Destination Warehouse *"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
            <Input
              label="Receipt Date *"
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
            />
          </div>

          {/* Add Products Sub-table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-brand-textDark">Add Products</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs py-1"
              >
                Add Line Item
              </Button>
            </div>

            <div className="border border-brand-border rounded-xl overflow-hidden divide-y divide-brand-border/60">
              <div className="bg-brand-cream/40 px-3 py-2 grid grid-cols-12 gap-2 text-[11px] font-bold text-brand-textMuted uppercase">
                <div className="col-span-5">Product</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {items.map((item, index) => (
                <div key={index} className="p-2.5 grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-5">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="w-full rounded-lg bg-white border border-brand-border p-1.5 text-xs text-brand-textDark outline-none focus:border-brand-caramel"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                      className="w-full text-center rounded-lg bg-white border border-brand-border p-1.5 text-xs text-brand-textDark outline-none focus:border-brand-caramel"
                    />
                  </div>
                  <div className="col-span-2 text-right font-medium text-brand-textMuted">
                    ₹{item.unitPrice.toLocaleString()}
                  </div>
                  <div className="col-span-2 text-right font-bold text-brand-textDark">
                    ₹{item.totalPrice.toLocaleString()}
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length <= 1}
                      className="text-brand-textMuted hover:text-red-600 disabled:opacity-30 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="flex justify-end items-center gap-3 mt-3 px-2">
              <span className="text-xs text-brand-textMuted font-semibold">Total Consignment Value:</span>
              <span className="text-lg font-extrabold text-brand-textDark">₹{totalReceiptCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-textDark">Receipt Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received at Bay 3..."
              rows={2}
              className="w-full rounded-xl bg-white border border-brand-border p-2.5 text-xs text-brand-textDark focus:border-brand-caramel outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSaveReceipt('Draft')}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSaveReceipt('Confirmed')}
            >
              Confirm Receipt
            </Button>
          </div>
        </div>
      </Modal>

      {/* RECEIPT DETAILS MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Receipt: ${activeReceipt?.receiptNumber}`}
        description={`Supplier: ${activeReceipt?.supplier} | Date: ${activeReceipt?.receiptDate}`}
        maxWidth="xl"
      >
        {activeReceipt && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-cream/60 border border-brand-border">
              <div>
                <span className="text-[11px] text-brand-textMuted block">Destination Warehouse</span>
                <span className="text-sm font-bold text-brand-textDark">{activeReceipt.warehouseName}</span>
              </div>
              <div>
                <span className="text-[11px] text-brand-textMuted block">Current Status</span>
                {getStatusBadge(activeReceipt.status)}
              </div>
            </div>

            {/* Products List */}
            <div className="border border-brand-border rounded-xl overflow-hidden">
              <div className="bg-brand-cream/40 px-3 py-2 grid grid-cols-3 text-[11px] font-bold text-brand-textMuted uppercase">
                <span>Product Item</span>
                <span className="text-center">Quantity</span>
                <span className="text-right">Unit Price</span>
              </div>
              <div className="divide-y divide-brand-border/60">
                {activeReceipt.items.map((it, idx) => (
                  <div key={idx} className="px-3 py-2.5 grid grid-cols-3 text-xs items-center">
                    <div>
                      <p className="font-bold text-brand-textDark">{it.productName}</p>
                      <p className="text-[11px] text-brand-textMuted">{it.sku}</p>
                    </div>
                    <div className="text-center font-semibold text-brand-textDark">
                      {it.quantity} {it.unit}
                    </div>
                    <div className="text-right font-bold text-brand-textDark">
                      ₹{it.unitPrice.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {activeReceipt.notes && (
              <p className="text-xs text-brand-textMuted italic bg-brand-cream/30 p-2.5 rounded-lg">
                Note: {activeReceipt.notes}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-brand-border">
              {activeReceipt.status === 'Waiting' || activeReceipt.status === 'Draft' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsConfirmModalOpen(true)}
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                >
                  Confirm & Stock Intake
                </Button>
              ) : (
                <div />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM DIRECT MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Inbound Receipt"
        description={`Confirming receipt ${activeReceipt?.receiptNumber} will mark products as received.`}
      >
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 mb-4">
          All items in this shipment will be marked as verified and added to the warehouse stock ledger.
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfirmModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmDirectly}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Confirm Receipt
          </Button>
        </div>
      </Modal>
    </div>
  );
};
