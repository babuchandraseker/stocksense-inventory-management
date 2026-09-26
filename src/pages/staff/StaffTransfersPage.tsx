import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge, BadgeVariant } from '../../components/common/Badge';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';
import { TransferStatus } from '../../types/inventory';
import {
  ArrowLeftRight,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const StaffTransfersPage: React.FC = () => {
  const { products, warehouses, createTransfer, transfers } = useInventory();
  const { showToast } = useToast();

  const [fromWarehouseId, setFromWarehouseId] = useState('wh-main');
  const [toWarehouseId, setToWarehouseId] = useState('wh-north');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(5);
  const [notes, setNotes] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId) || products[0];
  const fromWh = warehouses.find((w) => w.id === fromWarehouseId) || warehouses[0];
  const toWh = warehouses.find((w) => w.id === toWarehouseId) || warehouses[1];

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromWarehouseId === toWarehouseId) {
      showToast({
        type: 'warning',
        title: 'Invalid Locations',
        message: 'Origin and destination warehouses must be different.',
      });
      return;
    }
    if (quantity <= 0 || quantity > (selectedProduct?.currentStock || 0)) {
      showToast({
        type: 'warning',
        title: 'Stock Unavailable',
        message: `Available units at ${fromWh.name}: ${selectedProduct?.currentStock || 0}.`,
      });
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmTransfer = () => {
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
      createdBy: 'Karthik (Staff)',
      notes,
    });

    showToast({
      type: 'success',
      title: 'Transfer Dispatched',
      message: `${newTrf.transferNumber}: Dispatched ${quantity} units of ${selectedProduct.name} to ${toWh.name}.`,
    });

    setIsConfirmOpen(false);
    setQuantity(5);
    setNotes('');
  };

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <PageHeader
        title="Stock Transfers"
        subtitle="Step-by-step stock movement between logistics centers: Source → Destination → Product → Quantity → Confirm."
      />

      {/* Main Transfer Form Card */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-brand-caramel" />
            <h3 className="font-bold text-sm text-brand-textDark">Initiate Stock Transfer</h3>
          </div>
        }
      >
        <form onSubmit={handleOpenReview} className="space-y-5">
          {/* Source & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="1. Source (Origin) Warehouse *"
              value={fromWarehouseId}
              onChange={(e) => setFromWarehouseId(e.target.value)}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
            <Select
              label="2. Destination (Target) Warehouse *"
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(e.target.value)}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>

          {/* Product & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Select
                label="3. Select Product *"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                options={products.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.sku}) — Available: ${p.currentStock} ${p.unit}`,
                }))}
              />
            </div>
            <Input
              label="4. Transfer Quantity *"
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
              placeholder="e.g. Replenishment dispatch for North warehouse..."
              rows={2}
              className="w-full rounded-xl bg-white border border-brand-border p-2.5 text-xs text-brand-textDark focus:border-brand-caramel outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Review & Dispatch Transfer
            </Button>
          </div>
        </form>
      </Card>

      {/* Recent Transfers List */}
      <div>
        <h4 className="text-sm font-bold text-brand-textDark mb-3">Recent Transfer Shipments</h4>
        <div className="bg-white rounded-2xl border border-brand-border shadow-warm divide-y divide-brand-border/60 overflow-hidden">
          {transfers.slice(0, 4).map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-brand-cream/20 transition-colors text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-cream text-brand-caramel flex items-center justify-center font-bold shrink-0">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-brand-textDark text-sm">{t.productName} ({t.quantity} Units)</p>
                  <p className="text-brand-textMuted">{t.fromWarehouseName} → {t.toWarehouseName}</p>
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(t.status)}
                <p className="text-[10px] text-brand-textMuted mt-1">{t.transferDate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirm Stock Transfer Dispatch"
        description="Verify origin, destination, and product quantities before dispatch."
      >
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-brand-textMuted">Product:</span>
              <span className="font-bold text-brand-textDark">{selectedProduct?.name} ({selectedProduct?.sku})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-textMuted">From Origin:</span>
              <span className="font-semibold text-brand-textDark">{fromWh.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-textMuted">To Destination:</span>
              <span className="font-semibold text-brand-textDark">{toWh.name}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-brand-border">
              <span className="text-brand-textMuted font-bold">Transfer Quantity:</span>
              <span className="text-base font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                {quantity} {selectedProduct?.unit}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
            >
              Modify
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmTransfer}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm Dispatch
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
