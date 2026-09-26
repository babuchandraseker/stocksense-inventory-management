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
import { Product, ProductStatus, AdjustmentReason } from '../../types/inventory';
import {
  Sliders,
  Package,
  Building2,
  Calendar,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { products, warehouses, createAdjustment } = useInventory();
  const { showToast } = useToast();

  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [countedQty, setCountedQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<AdjustmentReason>('Counting Error');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Categories & Warehouses
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  // Filtered Products
  const filteredInventory = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchValue.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const matchesWarehouse =
        selectedWarehouse === 'all' || item.warehouseId === selectedWarehouse;

      const matchesStatus =
        selectedStatus === 'all' || item.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
    });
  }, [products, searchValue, selectedCategory, selectedWarehouse, selectedStatus]);

  const totalPages = Math.ceil(filteredInventory.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInventory.slice(start, start + pageSize);
  }, [filteredInventory, currentPage, pageSize]);

  const handleOpenAdjust = (prod: Product) => {
    setActiveProduct(prod);
    setCountedQty(prod.currentStock);
    setAdjustReason('Counting Error');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;

    const diff = countedQty - activeProduct.currentStock;

    createAdjustment({
      productId: activeProduct.id,
      productName: activeProduct.name,
      sku: activeProduct.sku,
      warehouseId: activeProduct.warehouseId,
      warehouseName: activeProduct.warehouseName,
      systemQuantity: activeProduct.currentStock,
      countedQuantity: countedQty,
      difference: diff,
      reason: adjustReason,
      notes: adjustNotes,
      adjustmentDate: new Date().toLocaleDateString('en-CA'),
      createdBy: 'Admin',
    });

    showToast({
      type: 'success',
      title: 'Stock adjustment applied',
      message: `${activeProduct.name} stock adjusted to ${countedQty} units (${diff >= 0 ? `+${diff}` : diff}).`,
    });

    setIsAdjustModalOpen(false);
  };

  const getStatusBadge = (status: ProductStatus) => {
    const map: Record<ProductStatus, { variant: BadgeVariant; text: string }> = {
      'In Stock': { variant: 'success', text: 'In Stock' },
      'Low Stock': { variant: 'warning', text: 'Low Stock' },
      'Out of Stock': { variant: 'danger', text: 'Out of Stock' },
    };
    const s = map[status] || { variant: 'neutral', text: status };
    return <Badge variant={s.variant} size="sm" dot>{s.text}</Badge>;
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-caramelLight/70 flex items-center justify-center text-brand-caramel shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-brand-textDark leading-snug">{item.name}</p>
            <p className="text-[11px] text-brand-textMuted">{item.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-brand-textDark font-medium">
          <Building2 className="w-3.5 h-3.5 text-brand-caramel" />
          <span>{item.warehouseName}</span>
        </div>
      ),
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      align: 'center',
      render: (item) => (
        <div>
          <span className="font-bold text-brand-textDark text-sm">{item.currentStock}</span>
          <span className="text-[11px] text-brand-textMuted ml-1">{item.unit}</span>
        </div>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder Level',
      align: 'center',
      render: (item) => (
        <span className="text-xs text-brand-textMuted font-semibold">{item.reorderLevel}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      render: (item) => (
        <div className="flex items-center gap-1 text-xs text-brand-textMuted">
          <Calendar className="w-3.5 h-3.5 text-brand-textLight" />
          <span>{item.lastUpdated}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenAdjust(item)}
          leftIcon={<Sliders className="w-3.5 h-3.5 text-brand-caramel" />}
          className="text-xs py-1 px-2.5"
        >
          Adjust Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Inventory Overview"
        subtitle="Real-time multi-location stock levels, reorder thresholds, and bin allocations."
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-warm">
          <p className="text-xs text-brand-textMuted font-semibold">Total Stocked Items</p>
          <p className="text-2xl font-extrabold text-brand-textDark mt-1">{products.length} SKUs</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-warm">
          <p className="text-xs text-brand-textMuted font-semibold">Available Units</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">
            {products.reduce((acc, p) => acc + p.currentStock, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-warm">
          <p className="text-xs text-brand-textMuted font-semibold">Low Stock SKUs</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {products.filter((p) => p.status === 'Low Stock').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-warm">
          <p className="text-xs text-brand-textMuted font-semibold">Out of Stock</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            {products.filter((p) => p.status === 'Out of Stock').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Filter inventory by product name or SKU..."
        filters={[
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
          {
            id: 'category',
            value: selectedCategory,
            onChange: setSelectedCategory,
            placeholder: 'All Categories',
            options: [
              { value: 'all', label: 'All Categories' },
              ...categories.map((c) => ({ value: c, label: c })),
            ],
          },
          {
            id: 'status',
            value: selectedStatus,
            onChange: setSelectedStatus,
            placeholder: 'All Statuses',
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'In Stock', label: 'In Stock' },
              { value: 'Low Stock', label: 'Low Stock' },
              { value: 'Out of Stock', label: 'Out of Stock' },
            ],
          },
        ]}
        onResetFilters={() => {
          setSearchValue('');
          setSelectedCategory('all');
          setSelectedWarehouse('all');
          setSelectedStatus('all');
        }}
      />

      {/* Inventory Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredInventory.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      />

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock: ${activeProduct?.name}`}
        description="Record physical count discrepancies, damages, or shrinkage adjustments."
      >
        {activeProduct && (
          <form onSubmit={handleSaveAdjustment} className="space-y-4">
            <div className="p-3 bg-brand-cream/60 rounded-xl border border-brand-border text-xs flex justify-between">
              <div>
                <span className="text-brand-textMuted block">Current System Quantity:</span>
                <span className="font-bold text-base text-brand-textDark">{activeProduct.currentStock} {activeProduct.unit}</span>
              </div>
              <div className="text-right">
                <span className="text-brand-textMuted block">Warehouse:</span>
                <span className="font-semibold text-brand-textDark">{activeProduct.warehouseName}</span>
              </div>
            </div>

            <Input
              label="Physical Counted Quantity *"
              type="number"
              value={countedQty}
              onChange={(e) => setCountedQty(parseInt(e.target.value) || 0)}
              min={0}
              required
            />

            {/* Calculated Difference Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-creamDark/40 border border-brand-border text-xs">
              <span className="font-semibold text-brand-textDark">Calculated Net Adjustment:</span>
              <span
                className={`font-extrabold text-sm px-2.5 py-0.5 rounded-lg ${
                  countedQty - activeProduct.currentStock > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : countedQty - activeProduct.currentStock < 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-brand-cream text-brand-textMedium'
                }`}
              >
                {countedQty - activeProduct.currentStock > 0
                  ? `+${countedQty - activeProduct.currentStock}`
                  : countedQty - activeProduct.currentStock}{' '}
                {activeProduct.unit}
              </span>
            </div>

            <Select
              label="Adjustment Reason *"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value as AdjustmentReason)}
              options={[
                { value: 'Counting Error', label: 'Counting Error' },
                { value: 'Damaged', label: 'Damaged Goods' },
                { value: 'Lost', label: 'Lost / Theft' },
                { value: 'Found', label: 'Found Inventory' },
                { value: 'Other', label: 'Other' },
              ]}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brand-textDark">Reason Notes</label>
              <textarea
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="Details of audit or damaged consignment..."
                rows={2}
                className="w-full rounded-xl bg-white border border-brand-border p-2.5 text-xs text-brand-textDark focus:border-brand-caramel outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdjustModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Apply Adjustment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
