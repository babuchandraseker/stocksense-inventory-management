import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';
import {
  PackagePlus,
  CheckCircle2,
  ArrowRight,
  Package,
} from 'lucide-react';

export const StaffReceivePage: React.FC = () => {
  const { products, warehouses, createReceipt, receipts } = useInventory();
  const { showToast } = useToast();

  const suppliersList = ['ABC Steel Supplier', 'National Steel Corp', 'Apex Manufacturing'];

  // Form State
  const [supplier, setSupplier] = useState('ABC Steel Supplier');
  const [warehouseId, setWarehouseId] = useState('wh-main');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState('');

  // Confirmation Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId) || products[0];
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId) || warehouses[0];

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      showToast({ type: 'warning', title: 'Invalid Quantity', message: 'Quantity must be at least 1 unit.' });
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmReceipt = () => {
    const newRec = createReceipt({
      supplier,
      warehouseId: selectedWarehouse.id,
      warehouseName: selectedWarehouse.name,
      receiptDate: new Date().toLocaleDateString('en-CA'),
      status: 'Confirmed',
      items: [
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          quantity,
          unit: selectedProduct.unit,
          unitPrice: selectedProduct.costPrice,
          totalPrice: selectedProduct.costPrice * quantity,
        },
      ],
      createdBy: 'Karthik',
      notes,
    });

    showToast({
      type: 'success',
      title: 'Goods Received & Stocked',
      message: `${newRec.receiptNumber}: Logged ${quantity} units of ${selectedProduct.name} at ${selectedWarehouse.name}.`,
    });

    setIsConfirmOpen(false);
    setQuantity(10);
    setNotes('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <PageHeader
        title="Receive Goods"
        subtitle="Fast inbound consignment intake: Supplier → Warehouse → Product → Quantity → Confirm."
      />

      {/* Main Fast Intake Card */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-brand-caramel" />
            <h3 className="font-bold text-sm text-brand-textDark">Quick Receiving Form</h3>
          </div>
        }
      >
        <form onSubmit={handleOpenReview} className="space-y-5">
          {/* Step 1 & 2: Supplier & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="1. Origin Supplier *"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              options={suppliersList.map((s) => ({ value: s, label: s }))}
            />
            <Select
              label="2. Destination Warehouse *"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>

          {/* Step 3 & 4: Product & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Select
                label="3. Product Item *"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                options={products.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.sku}) — Available: ${p.currentStock}`,
                }))}
              />
            </div>
            <Input
              label="4. Received Quantity *"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          {/* Stock Intake Preview Ribbon */}
          {selectedProduct && (
            <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-caramelLight flex items-center justify-center text-brand-caramel font-bold shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-brand-textDark text-sm">{selectedProduct.name}</p>
                  <p className="text-brand-textMuted">SKU: {selectedProduct.sku} • Current Stock: {selectedProduct.currentStock} {selectedProduct.unit}</p>
                </div>
              </div>
              <div className="text-right sm:text-right w-full sm:w-auto">
                <span className="text-brand-textMuted block text-[11px]">New Projected Stock:</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {selectedProduct.currentStock + quantity} {selectedProduct.unit} (+{quantity})
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-textDark">Receiving Slip Notes / Bay Number</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Unloaded at Bay 2, pallet undamaged..."
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
              Review & Confirm Receipt
            </Button>
          </div>
        </form>
      </Card>

      {/* Recent Goods Received List */}
      <div>
        <h4 className="text-sm font-bold text-brand-textDark mb-3">Recently Received Shipments</h4>
        <div className="bg-white rounded-2xl border border-brand-border shadow-warm divide-y divide-brand-border/60 overflow-hidden">
          {receipts.slice(0, 4).map((rec) => (
            <div key={rec.id} className="p-4 flex items-center justify-between hover:bg-brand-cream/20 transition-colors text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-brand-textDark text-sm">{rec.receiptNumber}</p>
                  <p className="text-brand-textMuted">{rec.supplier} • {rec.warehouseName}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="success" size="sm">+{rec.totalQuantity} Units</Badge>
                <p className="text-[10px] text-brand-textMuted mt-1">{rec.receiptDate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirm Goods Receiving"
        description="Please verify the consignment details before recording stock intake."
      >
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-brand-textMuted">Supplier:</span>
              <span className="font-bold text-brand-textDark">{supplier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-textMuted">Warehouse Hub:</span>
              <span className="font-semibold text-brand-textDark">{selectedWarehouse.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-textMuted">Product SKU:</span>
              <span className="font-bold text-brand-textDark">{selectedProduct?.name} ({selectedProduct?.sku})</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-brand-border">
              <span className="text-brand-textMuted font-bold">Quantity to Intake:</span>
              <span className="text-base font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                +{quantity} {selectedProduct?.unit}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
            >
              Modify Entry
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmReceipt}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Stock Intake
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
