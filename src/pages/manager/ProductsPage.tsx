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
import { Product, ProductStatus } from '../../types/inventory';
import {
  Package,
  Plus,
  Eye,
  Edit2,
  Trash2,
  History,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, warehouses, ledger } = useInventory();
  const { showToast } = useToast();

  // Search, Filter & Pagination State
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    unit: 'Units',
    supplier: 'ABC Electronics',
    reorderLevel: 10,
    currentStock: 0,
    warehouseId: 'wh-main',
    costPrice: 0,
    sellingPrice: 0,
    description: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Dynamic Options
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set);
  }, [products]);

  const suppliers = useMemo(() => {
    const set = new Set(products.map((p) => p.supplier));
    return Array.from(set);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchValue.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'all' || item.status === selectedStatus;

      const matchesSupplier =
        selectedSupplier === 'all' || item.supplier === selectedSupplier;

      return matchesSearch && matchesCategory && matchesStatus && matchesSupplier;
    });
  }, [products, searchValue, selectedCategory, selectedStatus, selectedSupplier]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU code is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (!formData.supplier.trim()) errors.supplier = 'Supplier is required';
    if (formData.reorderLevel < 0) errors.reorderLevel = 'Reorder level cannot be negative';
    if (formData.currentStock < 0) errors.currentStock = 'Stock quantity cannot be negative';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Electronics',
      unit: 'Units',
      supplier: 'ABC Electronics',
      reorderLevel: 10,
      currentStock: 15,
      warehouseId: 'wh-main',
      costPrice: 500,
      sellingPrice: 999,
      description: '',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const selectedWh = warehouses.find((w) => w.id === formData.warehouseId) || warehouses[0];

    const newProd = addProduct({
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      unit: formData.unit,
      supplier: formData.supplier,
      reorderLevel: Number(formData.reorderLevel),
      currentStock: Number(formData.currentStock),
      warehouseId: selectedWh.id,
      warehouseName: selectedWh.name,
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      description: formData.description,
    });

    showToast({
      type: 'success',
      title: 'Product added successfully',
      message: `${newProd.name} (${newProd.sku}) has been saved to your catalog.`,
    });

    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (prod: Product) => {
    setActiveProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      unit: prod.unit,
      supplier: prod.supplier,
      reorderLevel: prod.reorderLevel,
      currentStock: prod.currentStock,
      warehouseId: prod.warehouseId,
      costPrice: prod.costPrice,
      sellingPrice: prod.sellingPrice,
      description: prod.description || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !activeProduct) return;

    const selectedWh = warehouses.find((w) => w.id === formData.warehouseId) || warehouses[0];

    updateProduct(activeProduct.id, {
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      unit: formData.unit,
      supplier: formData.supplier,
      reorderLevel: Number(formData.reorderLevel),
      currentStock: Number(formData.currentStock),
      warehouseId: selectedWh.id,
      warehouseName: selectedWh.name,
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      description: formData.description,
    });

    showToast({
      type: 'success',
      title: 'Product updated',
      message: `Changes to ${formData.name} were successfully saved.`,
    });

    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    if (!activeProduct) return;
    deleteProduct(activeProduct.id);
    showToast({
      type: 'success',
      title: 'Product deleted',
      message: `${activeProduct.name} has been removed.`,
    });
    setIsDeleteModalOpen(false);
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

  const productLedgerHistory = useMemo(() => {
    if (!activeProduct) return [];
    return ledger.filter((l) => l.productId === activeProduct.id || l.sku === activeProduct.sku);
  }, [activeProduct, ledger]);

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
      key: 'category',
      header: 'Category',
      render: (item) => (
        <span className="text-xs px-2 py-0.5 rounded-lg bg-brand-cream text-brand-textMedium font-semibold">
          {item.category}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (item) => <span className="text-xs text-brand-textDark">{item.supplier}</span>,
    },
    {
      key: 'currentStock',
      header: 'Current',
      align: 'center',
      render: (item) => (
        <span className="font-bold text-brand-textDark text-sm">{item.currentStock}</span>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Min',
      align: 'center',
      render: (item) => (
        <span className="text-xs text-brand-textMuted">{item.reorderLevel}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setActiveProduct(item);
              setIsDetailsModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-brand-textMuted hover:text-brand-textDark hover:bg-brand-cream transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 rounded-lg text-brand-textMuted hover:text-brand-caramel hover:bg-brand-cream transition-colors"
            title="Edit Product"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setActiveProduct(item);
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-brand-textMuted hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Products"
        subtitle="Manage all products, categories, SKU codes and suppliers in your inventory."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Add Product
          </Button>
        }
      />

      {/* Filter and Search Controls */}
      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search products by name, SKU, supplier..."
        filters={[
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
            placeholder: 'All Status',
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'In Stock', label: 'In Stock' },
              { value: 'Low Stock', label: 'Low Stock' },
              { value: 'Out of Stock', label: 'Out of Stock' },
            ],
          },
          {
            id: 'supplier',
            value: selectedSupplier,
            onChange: setSelectedSupplier,
            placeholder: 'All Suppliers',
            options: [
              { value: 'all', label: 'All Suppliers' },
              ...suppliers.map((s) => ({ value: s, label: s })),
            ],
          },
        ]}
        onResetFilters={() => {
          setSearchValue('');
          setSelectedCategory('all');
          setSelectedStatus('all');
          setSelectedSupplier('all');
        }}
      />

      {/* Products DataTable */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        selectable
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredProducts.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      />

      {/* ADD PRODUCT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Product"
        description="Enter product attributes and initial stock parameters."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. iPhone 15 Pro Max"
              error={formErrors.name}
            />
            <Input
              label="SKU Code *"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g. IP15-PRO-256"
              error={formErrors.sku}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Category *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'Electronics', label: 'Electronics' },
                { value: 'Accessories', label: 'Accessories' },
                { value: 'Furniture', label: 'Furniture' },
                { value: 'Logistics', label: 'Logistics' },
              ]}
              error={formErrors.category}
            />
            <Input
              label="Unit *"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="Units, Boxes, Kg"
            />
            <Select
              label="Supplier *"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              options={[
                { value: 'ABC Electronics', label: 'ABC Electronics' },
                { value: 'TechMart', label: 'TechMart' },
                { value: 'Global Traders', label: 'Global Traders' },
                { value: 'FurniCo', label: 'FurniCo' },
              ]}
              error={formErrors.supplier}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Initial Stock Quantity"
              type="number"
              value={formData.currentStock}
              onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
              error={formErrors.currentStock}
            />
            <Input
              label="Reorder Level (Min)"
              type="number"
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
              error={formErrors.reorderLevel}
            />
            <Select
              label="Primary Warehouse *"
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cost Price (₹)"
              type="number"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Selling Price (₹)"
              type="number"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-textDark">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed specifications or storage conditions..."
              rows={3}
              className="w-full rounded-xl bg-white border border-brand-border p-3 text-sm text-brand-textDark placeholder:text-brand-textLight focus:border-brand-caramel focus:ring-2 focus:ring-brand-caramelLight/50 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT PRODUCT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Product: ${activeProduct?.name}`}
        description="Update product attributes, supplier, and threshold values."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
            />
            <Input
              label="SKU Code *"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              error={formErrors.sku}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Category *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'Electronics', label: 'Electronics' },
                { value: 'Accessories', label: 'Accessories' },
                { value: 'Furniture', label: 'Furniture' },
                { value: 'Logistics', label: 'Logistics' },
              ]}
              error={formErrors.category}
            />
            <Input
              label="Unit *"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
            <Select
              label="Supplier *"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              options={[
                { value: 'ABC Electronics', label: 'ABC Electronics' },
                { value: 'TechMart', label: 'TechMart' },
                { value: 'Global Traders', label: 'Global Traders' },
                { value: 'FurniCo', label: 'FurniCo' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Reorder Level (Min)"
              type="number"
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
            />
            <Select
              label="Warehouse *"
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cost Price (₹)"
              type="number"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Selling Price (₹)"
              type="number"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-textDark">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl bg-white border border-brand-border p-3 text-sm text-brand-textDark focus:border-brand-caramel focus:ring-2 focus:ring-brand-caramelLight/50 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Update Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* PRODUCT DETAILS DRAWER / MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={activeProduct?.name}
        description={`SKU: ${activeProduct?.sku} | Category: ${activeProduct?.category}`}
        maxWidth="2xl"
      >
        {activeProduct && (
          <div className="space-y-6">
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border">
                <p className="text-[11px] text-brand-textMuted font-medium">Current Stock</p>
                <p className="text-xl font-bold text-brand-textDark mt-0.5">{activeProduct.currentStock}</p>
                <span className="text-[10px] text-brand-textMuted">{activeProduct.unit}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border">
                <p className="text-[11px] text-brand-textMuted font-medium">Reorder Level</p>
                <p className="text-xl font-bold text-amber-700 mt-0.5">{activeProduct.reorderLevel}</p>
                <span className="text-[10px] text-brand-textMuted">Threshold</span>
              </div>
              <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border">
                <p className="text-[11px] text-brand-textMuted font-medium">Status</p>
                <div className="mt-1">{getStatusBadge(activeProduct.status)}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border">
                <p className="text-[11px] text-brand-textMuted font-medium">Unit Price</p>
                <p className="text-xl font-bold text-brand-textDark mt-0.5">₹{activeProduct.sellingPrice.toLocaleString()}</p>
                <span className="text-[10px] text-brand-textMuted">MRP</span>
              </div>
            </div>

            {/* Product Meta Info */}
            <div className="p-4 rounded-xl bg-brand-cream/40 border border-brand-border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Supplier:</span>
                <span className="font-bold text-brand-textDark">{activeProduct.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Assigned Warehouse:</span>
                <span className="font-bold text-brand-textDark">{activeProduct.warehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Last Inventory Update:</span>
                <span className="font-semibold text-brand-textDark">{activeProduct.lastUpdated}</span>
              </div>
              {activeProduct.description && (
                <div className="pt-2 border-t border-brand-border">
                  <span className="text-brand-textMuted block mb-1">Description:</span>
                  <p className="text-brand-textDark italic">{activeProduct.description}</p>
                </div>
              )}
            </div>

            {/* Stock History Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-brand-caramel" />
                <h4 className="text-sm font-bold text-brand-textDark">Stock Movement History</h4>
              </div>
              {productLedgerHistory.length === 0 ? (
                <p className="text-xs text-brand-textMuted bg-brand-cream/40 p-4 rounded-xl text-center">
                  No recorded transactions yet for this product.
                </p>
              ) : (
                <div className="divide-y divide-brand-border/60 border border-brand-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {productLedgerHistory.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-brand-cream/20">
                      <div>
                        <span className="font-bold text-brand-textDark mr-2">[{item.transactionType}]</span>
                        <span className="text-brand-textMuted">{item.reference}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-brand-textMuted">{item.date}</span>
                        <span className={`font-bold ${item.quantity > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleOpenEdit(activeProduct);
                }}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit Product
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Product Deletion"
        description={`Are you sure you want to remove "${activeProduct?.name}" from the catalog?`}
      >
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 mb-4">
          This action will permanently remove this item from the active inventory catalog.
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete Product
          </Button>
        </div>
      </Modal>
    </div>
  );
};
