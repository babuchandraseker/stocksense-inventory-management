import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { FilterBar } from '../../components/common/FilterBar';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge, BadgeVariant } from '../../components/common/Badge';
import { useInventory } from '../../context/InventoryContext';
import { LedgerEntry, TransactionType } from '../../types/inventory';
import {
  Calendar,
  Building2,
  Receipt,
  Truck,
  ArrowLeftRight,
  Sliders,
} from 'lucide-react';

export const StockLedgerPage: React.FC = () => {
  const { ledger, warehouses } = useInventory();

  const [searchValue, setSearchValue] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredLedger = useMemo(() => {
    return ledger.filter((item) => {
      const matchesSearch =
        item.productName.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.reference.toLowerCase().includes(searchValue.toLowerCase());

      const matchesType = selectedType === 'all' || item.transactionType === selectedType;
      const matchesWarehouse = selectedWarehouse === 'all' || item.warehouseId === selectedWarehouse;

      return matchesSearch && matchesType && matchesWarehouse;
    });
  }, [ledger, searchValue, selectedType, selectedWarehouse]);

  const totalPages = Math.ceil(filteredLedger.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLedger.slice(start, start + pageSize);
  }, [filteredLedger, currentPage, pageSize]);

  const getTransactionBadge = (type: TransactionType) => {
    const map: Record<TransactionType, { variant: BadgeVariant; icon: React.ReactNode; label: string }> = {
      RECEIPT: { variant: 'success', icon: <Receipt className="w-3 h-3" />, label: 'Receipt' },
      TRANSFER_IN: { variant: 'info', icon: <ArrowLeftRight className="w-3 h-3" />, label: 'Transfer In' },
      TRANSFER_OUT: { variant: 'caramel', icon: <ArrowLeftRight className="w-3 h-3" />, label: 'Transfer Out' },
      DELIVERY: { variant: 'gold', icon: <Truck className="w-3 h-3" />, label: 'Delivery' },
      ADJUSTMENT: { variant: 'warning', icon: <Sliders className="w-3 h-3" />, label: 'Adjustment' },
    };

    const config = map[type] || { variant: 'neutral', icon: null, label: type };

    return (
      <Badge variant={config.variant} size="sm">
        <span className="flex items-center gap-1">
          {config.icon}
          <span>{config.label}</span>
        </span>
      </Badge>
    );
  };

  const columns: Column<LedgerEntry>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-brand-textDark font-medium">
          <Calendar className="w-3.5 h-3.5 text-brand-textLight" />
          <span>{item.date}</span>
        </div>
      ),
    },
    {
      key: 'productName',
      header: 'Product Item',
      render: (item) => (
        <div>
          <p className="font-bold text-brand-textDark text-xs">{item.productName}</p>
          <p className="text-[10px] text-brand-textMuted">{item.sku}</p>
        </div>
      ),
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
      key: 'transactionType',
      header: 'Transaction Type',
      align: 'center',
      render: (item) => getTransactionBadge(item.transactionType),
    },
    {
      key: 'quantity',
      header: 'Quantity Impact',
      align: 'center',
      render: (item) => (
        <span
          className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
            item.quantity > 0
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : item.quantity < 0
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-brand-cream text-brand-textMuted'
          }`}
        >
          {item.quantity > 0 ? `+${item.quantity}` : item.quantity} Units
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (item) => (
        <span className="text-xs font-mono font-bold text-brand-textDark bg-brand-cream/60 px-2 py-0.5 rounded border border-brand-border">
          {item.reference}
        </span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      render: (item) => <span className="text-xs text-brand-textMuted">{item.createdBy}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Stock Ledger"
        subtitle="Complete immutable chronological audit trail of all warehouse transactions, receipts, adjustments, and dispatches."
      />

      {/* Filter */}
      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search ledger by product, SKU, reference ID..."
        filters={[
          {
            id: 'type',
            value: selectedType,
            onChange: setSelectedType,
            placeholder: 'All Transaction Types',
            options: [
              { value: 'all', label: 'All Transaction Types' },
              { value: 'RECEIPT', label: 'Receipts' },
              { value: 'DELIVERY', label: 'Deliveries' },
              { value: 'TRANSFER_IN', label: 'Transfer In' },
              { value: 'TRANSFER_OUT', label: 'Transfer Out' },
              { value: 'ADJUSTMENT', label: 'Adjustments' },
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
          setSelectedType('all');
          setSelectedWarehouse('all');
        }}
      />

      {/* Ledger Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredLedger.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  );
};
