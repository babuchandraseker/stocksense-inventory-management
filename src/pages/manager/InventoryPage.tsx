import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { FilterBar } from '../../components/common/FilterBar';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge, BadgeVariant } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Card } from '../../components/common/Card';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';
import { Product, ProductStatus, AdjustmentReason, LocationStock } from '../../types/inventory';
import {
  Sliders,
  Package,
  Building2,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { products, warehouses, locationStocks, locations, createAdjustment } = useInventory();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'products' | 'locations'>('products');
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('Main Warehouse');
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

  // Filtered Location Stocks
  const filteredLocationStocks = useMemo(() => {
    return locationStocks.filter((ls) => {
      const matchesSearch =
        ls.productName.toLowerCase().includes(searchValue.toLowerCase()) ||
        ls.sku.toLowerCase().includes(searchValue.toLowerCase()) ||
        ls.locationName.toLowerCase().includes(searchValue.toLowerCase());

      const matchesWarehouse =
        selectedWarehouse === 'all' || ls.warehouseId === selectedWarehouse;

      return matchesSearch && matchesWarehouse;
    });
  }, [locationStocks, searchValue, selectedWarehouse]);

  const handleOpenAdjust = (prod: Product, defaultLocation?: string) => {
    setActiveProduct(prod);
    setSelectedLocation(defaultLocation || 'Main Warehouse');
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
      locationName: selectedLocation,
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
      message: `${activeProduct.name} stock adjusted to ${countedQty} ${activeProduct.unit} (${diff >= 0 ? `+${diff}` : diff}).`,
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
      header: 'Product & SKU',
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
      key: 'category',
      header: 'Category',
      render: (item) => (
        <Badge variant="neutral" size="sm">
          {item.category}
        </Badge>
      ),
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      render: (item) => (
        <div>
          <span className="font-extrabold text-brand-textDark text-sm">{item.currentStock}</span>
          <span className="text-xs text-brand-textMuted ml-1">{item.unit}</span>
        </div>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder Level',
      render: (item) => (
        <span className="text-xs font-semibold text-brand-textMuted">
          {item.reorderLevel} {item.unit}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-brand-textMuted">
          <Calendar className="w-3.5 h-3.5" />
          <span>{item.lastUpdated}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Sliders className="w-3.5 h-3.5" />}
          onClick={() => handleOpenAdjust(item)}
        >
          Adjust
        </Button>
      ),
    },
  ];

  const locationColumns: Column<LocationStock>[] = [
    {
      key: 'productName',
      header: 'Product',
      render: (item) => (
        <div>
          <p className="font-bold text-brand-textDark text-xs">{item.productName}</p>
          <p className="text-[11px] text-brand-textMuted">{item.sku}</p>
        </div>
      ),
    },
    {
      key: 'locationName',
      header: 'Storage Location',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary">
          <MapPin className="w-3.5 h-3.5 text-brand-caramel" />
          <span>{item.locationName}</span>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse',
      render: (item) => (
        <span className="text-xs text-brand-textDark">{item.warehouseName}</span>
      ),
    },
    {
      key: 'quantity',
      header: 'Available Quantity',
      render: (item) => (
        <Badge variant="neutral" size="md">
          <span className="font-bold text-brand-textDark">{item.quantity}</span>
          <span className="text-[11px] text-brand-textMuted ml-1">{item.unit}</span>
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Stock Availability & Inventory"
        subtitle="Real-time multi-location inventory levels, reorder thresholds, and physical stock tracking."
        actions={
          <div className="flex items-center bg-brand-cream p-1 rounded-xl border border-brand-border">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'products'
                  ? 'bg-white text-brand-textDark shadow-warm-sm'
                  : 'text-brand-textMuted hover:text-brand-textDark'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Products View</span>
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'locations'
                  ? 'bg-white text-brand-textDark shadow-warm-sm'
                  : 'text-brand-textMuted hover:text-brand-textDark'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Location Breakdown</span>
            </button>
          </div>
        }
      />

      {/* Location Stock Matrix Cards */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-caramel" />
              <h3 className="font-bold text-sm text-brand-textDark">Stock Availability per Location Breakdown</h3>
            </div>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sum of locations = Total Stock
            </span>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((prod) => {
            const locList = locationStocks.filter((ls) => ls.productId === prod.id);
            const totalLocStock = locList.reduce((sum, ls) => sum + ls.quantity, 0);

            return (
              <div
                key={prod.id}
                className="bg-brand-cream/30 p-4 rounded-xl border border-brand-border/70 hover:border-brand-caramel/50 transition-all shadow-warm-sm"
              >
                <div className="flex items-start justify-between pb-2 border-b border-brand-border/50">
                  <div>
                    <h4 className="text-xs font-bold text-brand-textDark">{prod.name}</h4>
                    <p className="text-[11px] text-brand-textMuted">{prod.sku} • {prod.category}</p>
                  </div>
                  <Badge variant={prod.status === 'In Stock' ? 'success' : prod.status === 'Low Stock' ? 'warning' : 'danger'} size="sm">
                    {prod.currentStock} {prod.unit}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  {locList.map((ls) => (
                    <div key={ls.id} className="flex justify-between items-center text-[11px] py-0.5">
                      <span className="text-brand-textMuted flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brand-caramel" />
                        {ls.locationName}
                      </span>
                      <span className="font-bold text-brand-textDark">{ls.quantity} {ls.unit}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-dashed border-brand-border text-xs font-extrabold text-brand-primary">
                    <span>Total Sum</span>
                    <span>{totalLocStock} {prod.unit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search by product name, SKU, or storage location..."
        filters={[
          {
            id: 'category',
            label: 'Category',
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
              { label: 'All Categories', value: 'all' },
              ...categories.map((c) => ({ label: c, value: c })),
            ],
          },
          {
            id: 'warehouse',
            label: 'Warehouse',
            value: selectedWarehouse,
            onChange: setSelectedWarehouse,
            options: [
              { label: 'All Warehouses', value: 'all' },
              ...warehouses.map((w) => ({ label: w.name, value: w.id })),
            ],
          },
          ...(activeTab === 'products'
            ? [
                {
                  id: 'status',
                  label: 'Status',
                  value: selectedStatus,
                  onChange: setSelectedStatus,
                  options: [
                    { label: 'All Statuses', value: 'all' },
                    { label: 'In Stock', value: 'In Stock' },
                    { label: 'Low Stock', value: 'Low Stock' },
                    { label: 'Out of Stock', value: 'Out of Stock' },
                  ],
                },
              ]
            : []),
        ]}
        onResetFilters={() => {
          setSearchValue('');
          setSelectedCategory('all');
          setSelectedWarehouse('all');
          setSelectedStatus('all');
        }}
      />

      {/* Main Data Table */}
      {activeTab === 'products' ? (
        <DataTable
          columns={columns}
          data={paginatedData}
          keyExtractor={(item) => item.id}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            totalItems: filteredInventory.length,
            pageSize,
          }}
          emptyMessage="No inventory records found. Try adjusting your filters."
        />
      ) : (
        <DataTable
          columns={locationColumns}
          data={filteredLocationStocks}
          keyExtractor={(item) => item.id}
          emptyMessage="No location stock records found. Try adjusting your search."
        />
      )}

      {/* Quick Adjust Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock — ${activeProduct?.name || ''}`}
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsAdjustModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveAdjustment}
            >
              Save Adjustment
            </Button>
          </div>
        }
      >
        {activeProduct && (
          <form onSubmit={handleSaveAdjustment} className="space-y-4">
            <div className="p-3 bg-brand-cream/50 rounded-xl border border-brand-border space-y-1">
              <div className="flex justify-between text-xs font-semibold text-brand-textDark">
                <span>SKU Code:</span>
                <span className="text-brand-caramel font-mono">{activeProduct.sku}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-brand-textDark">
                <span>Category:</span>
                <span>{activeProduct.category}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-brand-textDark">
                <span>System Recorded Stock:</span>
                <span className="font-extrabold text-brand-primary">{activeProduct.currentStock} {activeProduct.unit}</span>
              </div>
            </div>

            <Select
              label="Location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              options={locations.map((l) => ({ label: `${l.name} (${l.warehouseName})`, value: l.name }))}
            />

            <div>
              <label className="block text-xs font-bold text-brand-textDark mb-1">
                Physical Counted Stock ({activeProduct.unit})
              </label>
              <Input
                type="number"
                min={0}
                value={countedQty}
                onChange={(e) => setCountedQty(Number(e.target.value))}
                required
              />
            </div>

            <div className="p-3 rounded-xl border flex items-center justify-between text-xs font-bold bg-white border-brand-border">
              <span>Discrepancy (Difference):</span>
              <span
                className={
                  countedQty - activeProduct.currentStock > 0
                    ? 'text-emerald-700'
                    : countedQty - activeProduct.currentStock < 0
                    ? 'text-rose-700'
                    : 'text-brand-textDark'
                }
              >
                {countedQty - activeProduct.currentStock >= 0
                  ? `+${countedQty - activeProduct.currentStock}`
                  : countedQty - activeProduct.currentStock}{' '}
                {activeProduct.unit}
              </span>
            </div>

            <Select
              label="Reason for Variance"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value as AdjustmentReason)}
              options={[
                { label: 'Damaged (Scrapped / Broken)', value: 'Damaged' },
                { label: 'Counting Error', value: 'Counting Error' },
                { label: 'Found Unrecorded Stock', value: 'Found' },
                { label: 'Lost / Shrinkage', value: 'Lost' },
                { label: 'Other Variance', value: 'Other' },
              ]}
            />

            <div>
              <label className="block text-xs font-bold text-brand-textDark mb-1">
                Notes & Justification
              </label>
              <textarea
                rows={2}
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="Add audit justification notes..."
                className="w-full text-xs rounded-xl border border-brand-border p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-caramel"
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
