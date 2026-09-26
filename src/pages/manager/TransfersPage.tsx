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
import { Transfer, TransferStatus } from '../../types/inventory';
import {
  ArrowLeftRight,
  Plus,
  Eye,
  CheckCircle,
} from 'lucide-react';

export const TransfersPage: React.FC = () => {
  const { transfers, createTransfer, products, warehouses } = useInventory();
  const { showToast } = useToast();

  const [searchValue, setSearchValue] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeTransfer, setActiveTransfer] = useState<Transfer | null>(null);

  // Form
  const [fromWarehouseId, setFromWarehouseId] = useState('wh-main');
  const [toWarehouseId, setToWarehouseId] = useState('wh-north');
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(5);
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find((p) => p.id === selectedProdId) || products[0];
  const fromWh = warehouses.find((w) => w.id === fromWarehouseId) || warehouses[0];
  const toWh = warehouses.find((w) => w.id === toWarehouseId) || warehouses[1];

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromWarehouseId === toWarehouseId) {
      showToast({
        type: 'warning',
        title: 'Invalid Transfer',
        message: 'Source and destination warehouses cannot be the same.',
      });
      return;
    }
    if (quantity > (selectedProduct?.currentStock || 0)) {
      showToast({
        type: 'warning',
        title: 'Insufficient Stock',
        message: `Only ${selectedProduct?.currentStock} units available at ${fromWh.name}.`,
      });
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleExecuteTransfer = () => {
    const newTrf = createTransfer({
      fromWarehouseId: fromWh.id,
      fromWarehouseName: fromWh.name,
      toWarehouseId: toWh.id,
      toWarehouseName: toWh.name,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      quantity,
      status: 'In Transit',
      transferDate: new Date().toLocaleDateString('en-CA'),
      createdBy: 'Admin',
      notes,
    });

    showToast({
      type: 'success',
      title: 'Transfer Order Dispatched',
      message: `${newTrf.transferNumber} for ${newTrf.quantity} units of ${newTrf.productName} is in transit.`,
    });

    setIsConfirmModalOpen(false);
    setIsCreateModalOpen(false);
  };

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchesSearch =
        t.transferNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
        t.productName.toLowerCase().includes(searchValue.toLowerCase()) ||
        t.sku.toLowerCase().includes(searchValue.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [transfers, searchValue, selectedStatus]);

  const totalPages = Math.ceil(filteredTransfers.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransfers.slice(start, start + pageSize);
  }, [filteredTransfers, currentPage, pageSize]);

  const getStatusBadge = (status: TransferStatus) => {
    const map: Record<TransferStatus, { variant: BadgeVariant; text: string }> = {
      Pending: { variant: 'warning', text: 'Pending' },
      'In Transit': { variant: 'caramel', text: 'In Transit' },
      Completed: { variant: 'success', text: 'Completed' },
      Cancelled: { variant: 'danger', text: 'Cancelled' },
    };
    const s = map[status] || { variant: 'neutral', text: status };
    return <Badge variant={s.variant} size="sm" dot>{s.text}</Badge>;
  };

  const columns: Column<Transfer>[] = [
    {
      key: 'transferNumber',
      header: 'Transfer ID',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-cream flex items-center justify-center text-brand-caramel">
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-brand-textDark text-xs">{item.transferNumber}</span>
        </div>
      ),
    },
    {
      key: 'productName',
      header: 'Product',
      render: (item) => (
        <div>
          <p className="font-bold text-brand-textDark text-xs">{item.productName}</p>
          <p className="text-[10px] text-brand-textMuted">{item.sku}</p>
        </div>
      ),
    },
    {
      key: 'fromWarehouseName',
      header: 'From (Origin)',
      render: (item) => <span className="text-xs text-brand-textDark">{item.fromWarehouseName}</span>,
    },
    {
      key: 'toWarehouseName',
      header: 'To (Destination)',
      render: (item) => <span className="text-xs text-brand-textDark">{item.toWarehouseName}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'center',
      render: (item) => <span className="text-xs font-bold text-brand-textDark">{item.quantity} Units</span>,
    },
    {
      key: 'transferDate',
      header: 'Date',
      render: (item) => <span className="text-xs text-brand-textMuted">{item.transferDate}</span>,
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
        <button
          onClick={() => {
            setActiveTransfer(item);
            setIsDetailsModalOpen(true);
          }}
          className="p-1.5 rounded-lg text-brand-textMuted hover:text-brand-textDark hover:bg-brand-cream transition-colors"
          title="View Transfer"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Stock Transfers"
        subtitle="Manage inter-warehouse rebalancing and location-to-location inventory movements."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Transfer
          </Button>
        }
      />

      {/* Filter */}
      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search transfers by ID, product, SKU..."
        filters={[
          {
            id: 'status',
            value: selectedStatus,
            onChange: setSelectedStatus,
            placeholder: 'All Statuses',
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'Pending', label: 'Pending' },
              { value: 'In Transit', label: 'In Transit' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Cancelled', label: 'Cancelled' },
            ],
          },
        ]}
        onResetFilters={() => {
          setSearchValue('');
          setSelectedStatus('all');
        }}
      />

      {/* Transfers Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredTransfers.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      />

      {/* CREATE TRANSFER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initiate Inter-Warehouse Transfer"
        description="Rebalance stock between distribution hubs."
        maxWidth="lg"
      >
        <form onSubmit={handleOpenConfirm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Source (From) Warehouse *"
              value={fromWarehouseId}
              onChange={(e) => setFromWarehouseId(e.target.value)}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
            <Select
              label="Destination (To) Warehouse *"
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(e.target.value)}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Product Item *"
              value={selectedProdId}
              onChange={(e) => setSelectedProdId(e.target.value)}
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.currentStock} in stock)`,
              }))}
            />
            <Input
              label="Transfer Quantity *"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-textDark">Transfer Notes / Reason</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Stock rebalancing for north regional demand..."
              rows={2}
              className="w-full rounded-xl bg-white border border-brand-border p-2.5 text-xs text-brand-textDark focus:border-brand-caramel outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Review & Submit
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRMATION MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Stock Transfer"
        description="Verify origin, destination, and quantity parameters before dispatch."
      >
        <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-border space-y-2 text-xs mb-4">
          <div className="flex justify-between">
            <span className="text-brand-textMuted">Product:</span>
            <span className="font-bold text-brand-textDark">{selectedProduct?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-textMuted">Transfer Quantity:</span>
            <span className="font-bold text-brand-caramel">{quantity} Units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-textMuted">From Origin:</span>
            <span className="font-semibold text-brand-textDark">{fromWh.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-textMuted">To Destination:</span>
            <span className="font-semibold text-brand-textDark">{toWh.name}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfirmModalOpen(false)}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExecuteTransfer}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Confirm Dispatch
          </Button>
        </div>
      </Modal>

      {/* DETAILS MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Transfer: ${activeTransfer?.transferNumber}`}
        description={`Status: ${activeTransfer?.status}`}
      >
        {activeTransfer && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Product:</span>
                <span className="font-bold text-brand-textDark">{activeTransfer.productName} ({activeTransfer.sku})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Quantity Moved:</span>
                <span className="font-bold text-brand-textDark">{activeTransfer.quantity} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">From:</span>
                <span className="font-semibold text-brand-textDark">{activeTransfer.fromWarehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">To:</span>
                <span className="font-semibold text-brand-textDark">{activeTransfer.toWarehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Initiated Date:</span>
                <span className="font-semibold text-brand-textDark">{activeTransfer.transferDate}</span>
              </div>
              {activeTransfer.notes && (
                <div className="pt-2 border-t border-brand-border">
                  <span className="text-brand-textMuted block mb-1">Notes:</span>
                  <p className="text-brand-textDark italic">{activeTransfer.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
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
    </div>
  );
};
