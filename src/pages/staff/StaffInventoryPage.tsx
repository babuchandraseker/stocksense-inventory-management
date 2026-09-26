import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { FilterBar } from '../../components/common/FilterBar';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge, BadgeVariant } from '../../components/common/Badge';
import { useInventory } from '../../context/InventoryContext';
import { Product, ProductStatus } from '../../types/inventory';
import { Package, Building2 } from 'lucide-react';

export const StaffInventoryPage: React.FC = () => {
  const { products, warehouses } = useInventory();

  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  const filteredInventory = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchValue.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const matchesWarehouse =
        selectedWarehouse === 'all' || item.warehouseId === selectedWarehouse;

      return matchesSearch && matchesCategory && matchesWarehouse;
    });
  }, [products, searchValue, selectedCategory, selectedWarehouse]);

  const totalPages = Math.ceil(filteredInventory.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInventory.slice(start, start + pageSize);
  }, [filteredInventory, currentPage, pageSize]);

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
            <p className="font-bold text-brand-textDark text-sm">{item.name}</p>
            <p className="text-xs text-brand-textMuted">{item.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU Code',
      render: (item) => (
        <span className="text-xs font-mono font-bold text-brand-textDark bg-brand-cream/60 px-2 py-0.5 rounded border border-brand-border">
          {item.sku}
        </span>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse',
      render: (item) => (
        <span className="text-xs text-brand-textDark font-medium flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-brand-caramel" />
          {item.warehouseName}
        </span>
      ),
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      align: 'center',
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
      align: 'center',
      render: (item) => (
        <span className="text-xs text-brand-textMuted font-semibold">{item.reorderLevel} {item.unit}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (item) => getStatusBadge(item.status),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Warehouse Inventory"
        subtitle="Live lookup of stock availability, SKU identifiers, and bin locations."
      />

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Quick search product name or SKU..."
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
        ]}
        onResetFilters={() => {
          setSearchValue('');
          setSelectedCategory('all');
          setSelectedWarehouse('all');
        }}
      />

      {/* Staff Inventory Table */}
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
    </div>
  );
};
