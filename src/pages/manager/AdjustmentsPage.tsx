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
import { Adjustment, AdjustmentReason } from '../../types/inventory';
import { Sliders, Plus, Eye } from 'lucide-react';

export const AdjustmentsPage: React.FC = () => {
  const { adjustments, createAdjustment, products } = useInventory();
  const { showToast } = useToast();

  const [searchValue, setSearchValue] = useState('');
  const [selectedReason, setSelectedReason] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeAdjustment, setActiveAdjustment] = useState<Adjustment | null>(null);

  // Form State
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [countedQty, setCountedQty] = useState<number>(products[0]?.currentStock || 0);
  const [reason, setReason] = useState<AdjustmentReason>('Counting Error');
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find((p) => p.id === selectedProdId) || products[0];
  const systemQty = selectedProduct ? selectedProduct.currentStock : 0;
  const difference = countedQty - systemQty;

  const handleProductChange = (prodId: string) => {
    setSelectedProdId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setCountedQty(prod.currentStock);
    }
  };

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const newAdj = createAdjustment({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      warehouseId: selectedProduct.warehouseId,
      warehouseName: selectedProduct.warehouseName,
      systemQuantity: systemQty,
      countedQuantity: countedQty,
      difference,
      reason,
      notes,
      adjustmentDate: new Date().toLocaleDateString('en-CA'),
      createdBy: 'Admin',
    });

    showToast({
      type: 'success',
      title: 'Stock Adjustment Logged',
      message: `${newAdj.adjustmentNumber} recorded for ${newAdj.productName} (${difference >= 0 ? `+${difference}` : difference} units).`,
    });

    setIsCreateModalOpen(false);
    setNotes('');
  };

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((a) => {
      const matchesSearch =
        a.adjustmentNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
        a.productName.toLowerCase().includes(searchValue.toLowerCase()) ||
        a.sku.toLowerCase().includes(searchValue.toLowerCase());

      const matchesReason = selectedReason === 'all' || a.reason === selectedReason;
      return matchesSearch && matchesReason;
    });
  }, [adjustments, searchValue, selectedReason]);

  const totalPages = Math.ceil(filteredAdjustments.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAdjustments.slice(start, start + pageSize);
  }, [filteredAdjustments, currentPage, pageSize]);

  const getReasonBadge = (r: AdjustmentReason) => {
    const map: Record<AdjustmentReason, { variant: BadgeVariant }> = {
      'Counting Error': { variant: 'neutral' },
      Damaged: { variant: 'danger' },
      Lost: { variant: 'warning' },
      Found: { variant: 'success' },
      Other: { variant: 'caramel' },
    };
    return <Badge variant={map[r]?.variant || 'neutral'} size="sm">{r}</Badge>;
  };

  const columns: Column<Adjustment>[] = [
    {
      key: 'adjustmentNumber',
      header: 'Adjustment ID',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-cream flex items-center justify-center text-brand-caramel">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-brand-textDark text-xs">{item.adjustmentNumber}</span>
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
      key: 'warehouseName',
      header: 'Warehouse',
      render: (item) => <span className="text-xs text-brand-textMuted">{item.warehouseName}</span>,
    },
    {
      key: 'systemQuantity',
      header: 'System Qty',
      align: 'center',
      render: (item) => <span className="text-xs text-brand-textMuted">{item.systemQuantity}</span>,
    },
    {
      key: 'countedQuantity',
      header: 'Counted Qty',
      align: 'center',
      render: (item) => <span className="text-xs font-bold text-brand-textDark">{item.countedQuantity}</span>,
    },
    {
      key: 'difference',
      header: 'Difference',
      align: 'center',
      render: (item) => (
        <span
          className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
            item.difference > 0
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : item.difference < 0
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-brand-cream text-brand-textMuted'
          }`}
        >
          {item.difference > 0 ? `+${item.difference}` : item.difference} Units
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      align: 'center',
      render: (item) => getReasonBadge(item.reason),
    },
    {
      key: 'adjustmentDate',
      header: 'Date',
      render: (item) => <span className="text-xs text-brand-textMuted">{item.adjustmentDate}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <button
          onClick={() => {
            setActiveAdjustment(item);
            setIsDetailsModalOpen(true);
          }}
          className="p-1.5 rounded-lg text-brand-textMuted hover:text-brand-textDark hover:bg-brand-cream transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Stock Adjustments"
        subtitle="Record inventory discrepancies, reconcile damaged stocks, and audit cycle count variations."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              if (products[0]) {
                setSelectedProdId(products[0].id);
                setCountedQty(products[0].currentStock);
              }
              setIsCreateModalOpen(true);
            }}
          >
            Create Adjustment
          </Button>
        }
      />

      {/* Filter */}
      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search adjustments by ID, product, SKU..."
        filters={[
          {
            id: 'reason',
            value: selectedReason,
            onChange: setSelectedReason,
            placeholder: 'All Reasons',
            options: [
              { value: 'all', label: 'All Reasons' },
              { value: 'Counting Error', label: 'Counting Error' },
              { value: 'Damaged', label: 'Damaged' },
              { value: 'Lost', label: 'Lost' },
              { value: 'Found', label: 'Found' },
              { value: 'Other', label: 'Other' },
            ],
          },
        ]}
        onResetFilters={() => {
          setSearchValue('');
          setSelectedReason('all');
        }}
      />

      {/* Adjustments Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredAdjustments.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      />

      {/* CREATE ADJUSTMENT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Stock Adjustment"
        description="Reconcile recorded inventory balances with physical counts."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAdjustment} className="space-y-4">
          <Select
            label="Product Item *"
            value={selectedProdId}
            onChange={(e) => handleProductChange(e.target.value)}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.sku}) — In Stock: ${p.currentStock}`,
            }))}
          />

          <div className="p-3 bg-brand-cream/60 rounded-xl border border-brand-border text-xs flex justify-between">
            <div>
              <span className="text-brand-textMuted block">Current System Quantity:</span>
              <span className="font-bold text-base text-brand-textDark">{systemQty} Units</span>
            </div>
            <div className="text-right">
              <span className="text-brand-textMuted block">Assigned Warehouse:</span>
              <span className="font-semibold text-brand-textDark">{selectedProduct?.warehouseName}</span>
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

          {/* Real-time Calculated Difference Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-brand-creamDark/40 border border-brand-border text-xs">
            <span className="font-semibold text-brand-textDark">Calculated Net Difference:</span>
            <span
              className={`font-extrabold text-sm px-3 py-1 rounded-lg ${
                difference > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : difference < 0
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-brand-cream text-brand-textMedium'
              }`}
            >
              {difference > 0 ? `+${difference}` : difference} Units
            </span>
          </div>

          <Select
            label="Reason for Discrepancy *"
            value={reason}
            onChange={(e) => setReason(e.target.value as AdjustmentReason)}
            options={[
              { value: 'Counting Error', label: 'Counting Error / Reconciliation' },
              { value: 'Damaged', label: 'Damaged Goods' },
              { value: 'Lost', label: 'Lost / Theft' },
              { value: 'Found', label: 'Found Inventory' },
              { value: 'Other', label: 'Other' },
            ]}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-textDark">Adjustment Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Broken box found during weekly aisle audit..."
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
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* DETAILS MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Adjustment: ${activeAdjustment?.adjustmentNumber}`}
        description={`Product: ${activeAdjustment?.productName}`}
      >
        {activeAdjustment && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-border space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Product SKU:</span>
                <span className="font-bold text-brand-textDark">{activeAdjustment.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Warehouse:</span>
                <span className="font-semibold text-brand-textDark">{activeAdjustment.warehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Previous System Quantity:</span>
                <span className="font-semibold text-brand-textDark">{activeAdjustment.systemQuantity} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Counted Physical Quantity:</span>
                <span className="font-bold text-brand-textDark">{activeAdjustment.countedQuantity} Units</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-brand-border">
                <span className="text-brand-textMuted">Net Impact:</span>
                <span className={`font-extrabold ${activeAdjustment.difference >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {activeAdjustment.difference >= 0 ? `+${activeAdjustment.difference}` : activeAdjustment.difference} Units
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-textMuted">Reason:</span>
                {getReasonBadge(activeAdjustment.reason)}
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Logged By:</span>
                <span className="font-semibold text-brand-textDark">{activeAdjustment.createdBy} on {activeAdjustment.adjustmentDate}</span>
              </div>
              {activeAdjustment.notes && (
                <div className="pt-2 border-t border-brand-border">
                  <span className="text-brand-textMuted block mb-1">Notes:</span>
                  <p className="text-brand-textDark italic">{activeAdjustment.notes}</p>
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
