import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge, BadgeVariant } from '../../components/common/Badge';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';
import { AdjustmentReason } from '../../types/inventory';
import {
  ClipboardCheck,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

export const StaffStockCountPage: React.FC = () => {
  const { products, createAdjustment, adjustments } = useInventory();
  const { showToast } = useToast();

  const [productId, setProductId] = useState(products[0]?.id || '');
  const [countedQty, setCountedQty] = useState<number>(products[0]?.currentStock || 0);
  const [reason, setReason] = useState<AdjustmentReason>('Counting Error');
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find((p) => p.id === productId) || products[0];
  const systemQty = selectedProduct ? selectedProduct.currentStock : 0;
  const difference = countedQty - systemQty;

  const handleProductChange = (newProdId: string) => {
    setProductId(newProdId);
    const prod = products.find((p) => p.id === newProdId);
    if (prod) {
      setCountedQty(prod.currentStock);
    }
  };

  const handleSubmitCount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    createAdjustment({
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
      createdBy: 'Karthik (Staff)',
    });

    showToast({
      type: 'success',
      title: 'Physical Stock Count Recorded',
      message: `${selectedProduct.name}: Count recorded as ${countedQty} units (Discrepancy: ${difference >= 0 ? `+${difference}` : difference}).`,
    });

    setNotes('');
  };

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <PageHeader
        title="Physical Stock Count"
        subtitle="Perform cycle counts, audit bin balances, and report discrepancy reconciliation."
      />

      {/* Stock Count Entry Form Card */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-brand-caramel" />
            <h3 className="font-bold text-sm text-brand-textDark">Physical Count Entry</h3>
          </div>
        }
      >
        <form onSubmit={handleSubmitCount} className="space-y-5">
          <Select
            label="1. Select Product to Count *"
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.sku}) — System: ${p.currentStock} ${p.unit}`,
            }))}
          />

          {/* Real-time System vs Physical Comparison Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* System Quantity */}
            <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border text-center">
              <span className="text-xs text-brand-textMuted font-medium block">System Quantity</span>
              <span className="text-2xl font-extrabold text-brand-textDark mt-1 block">
                {systemQty}
              </span>
              <span className="text-[11px] text-brand-textMuted">Recorded in DB</span>
            </div>

            {/* Physical Count Input */}
            <div className="p-4 rounded-2xl bg-white border-2 border-brand-caramel text-center shadow-warm">
              <span className="text-xs font-bold text-brand-caramel block">Physical Counted Quantity *</span>
              <input
                type="number"
                min={0}
                value={countedQty}
                onChange={(e) => setCountedQty(parseInt(e.target.value) || 0)}
                className="w-full text-center text-2xl font-extrabold text-brand-textDark bg-transparent outline-none my-0.5"
                required
              />
              <span className="text-[11px] text-brand-textMuted">Enter actual count</span>
            </div>

            {/* Calculated Difference */}
            <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border text-center">
              <span className="text-xs text-brand-textMuted font-medium block">Calculated Difference</span>
              <span
                className={`text-2xl font-extrabold mt-1 block ${
                  difference > 0
                    ? 'text-emerald-700'
                    : difference < 0
                    ? 'text-rose-700'
                    : 'text-brand-textMedium'
                }`}
              >
                {difference > 0 ? `+${difference}` : difference}
              </span>
              <span className="text-[11px] text-brand-textMuted">Net Adjustment</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Reason for Variance *"
              value={reason}
              onChange={(e) => setReason(e.target.value as AdjustmentReason)}
              options={[
                { value: 'Counting Error', label: 'Cycle Count Reconciliation' },
                { value: 'Damaged', label: 'Damaged Products' },
                { value: 'Lost', label: 'Missing / Shrinkage' },
                { value: 'Found', label: 'Found Unlisted Units' },
                { value: 'Other', label: 'Other Variance' },
              ]}
            />
            <Input
              label="Audit Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified on Aisle 4 Shelf C"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Submit Count Audit
            </Button>
          </div>
        </form>
      </Card>

      {/* Recent Physical Audits List */}
      <div>
        <h4 className="text-sm font-bold text-brand-textDark mb-3">Recent Stock Count Audits</h4>
        <div className="bg-white rounded-2xl border border-brand-border shadow-warm divide-y divide-brand-border/60 overflow-hidden">
          {adjustments.slice(0, 5).map((adj) => (
            <div key={adj.id} className="p-4 flex items-center justify-between hover:bg-brand-cream/20 transition-colors text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-cream flex items-center justify-center text-brand-caramel font-bold shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-brand-textDark text-sm">{adj.productName}</p>
                  <p className="text-brand-textMuted">System: {adj.systemQuantity} → Counted: {adj.countedQuantity}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getReasonBadge(adj.reason)}
                <span
                  className={`font-extrabold px-2 py-0.5 rounded-md ${
                    adj.difference >= 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {adj.difference >= 0 ? `+${adj.difference}` : adj.difference}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
