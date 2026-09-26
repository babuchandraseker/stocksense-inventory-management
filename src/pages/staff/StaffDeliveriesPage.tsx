import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Badge, BadgeVariant } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';
import { Delivery, DeliveryStatus } from '../../types/inventory';
import {
  Truck,
  CheckCircle2,
  Package,
  ArrowRight,
  ClipboardList,
  Box,
  BadgeCheck,
} from 'lucide-react';

export const StaffDeliveriesPage: React.FC = () => {
  const { deliveries, advanceDeliveryStatus } = useInventory();
  const { showToast } = useToast();

  const [filterStage, setFilterStage] = useState<'all' | DeliveryStatus>('all');

  const statusWorkflow: DeliveryStatus[] = ['Draft', 'Pick', 'Pack', 'Validate'];
  const getWorkflowIndex = (st: DeliveryStatus) => statusWorkflow.indexOf(st);

  const handleNextStep = (del: Delivery) => {
    advanceDeliveryStatus(del.id);
    const nextIdx = Math.min(statusWorkflow.length - 1, getWorkflowIndex(del.status) + 1);
    const nextState = statusWorkflow[nextIdx];

    showToast({
      type: 'success',
      title: 'Order Progressed',
      message: `${del.deliveryNumber} moved to stage: "${nextState}".`,
    });
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    const map: Record<DeliveryStatus, { variant: BadgeVariant; text: string; icon: React.ReactNode }> = {
      Draft: { variant: 'neutral', text: '1. Queued Draft', icon: <ClipboardList className="w-3.5 h-3.5" /> },
      Pick: { variant: 'warning', text: '2. Picking Bins', icon: <Package className="w-3.5 h-3.5" /> },
      Pack: { variant: 'caramel', text: '3. Packing Carton', icon: <Box className="w-3.5 h-3.5" /> },
      Validate: { variant: 'success', text: '4. Validated & Ready', icon: <BadgeCheck className="w-3.5 h-3.5" /> },
    };
    const s = map[status] || { variant: 'neutral', text: status, icon: null };
    return (
      <Badge variant={s.variant} size="md">
        <span className="flex items-center gap-1.5">
          {s.icon}
          <span>{s.text}</span>
        </span>
      </Badge>
    );
  };

  const filteredDeliveries = deliveries.filter(
    (d) => filterStage === 'all' || d.status === filterStage
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      <PageHeader
        title="Delivery Operations"
        subtitle="Warehouse operational pipeline: Pick line items from bins → Pack carton & label → Validate & Dispatch."
      />

      {/* Stage Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterStage('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filterStage === 'all'
              ? 'bg-brand-primary text-white shadow-warm'
              : 'bg-white text-brand-textMedium hover:bg-brand-cream border border-brand-border'
          }`}
        >
          All Orders ({deliveries.length})
        </button>
        {statusWorkflow.map((st) => {
          const count = deliveries.filter((d) => d.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setFilterStage(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                filterStage === st
                  ? 'bg-brand-primary text-white shadow-warm'
                  : 'bg-white text-brand-textMedium hover:bg-brand-cream border border-brand-border'
              }`}
            >
              <span>{st} Stage</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand-creamDark text-brand-textDark">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Deliveries Operational Cards */}
      <div className="space-y-4">
        {filteredDeliveries.length === 0 ? (
          <Card className="text-center py-12">
            <Truck className="w-10 h-10 text-brand-caramel mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-brand-textDark">No shipments in this stage</p>
            <p className="text-xs text-brand-textMuted mt-1">Check other fulfillment stages above.</p>
          </Card>
        ) : (
          filteredDeliveries.map((del) => {
            const currentStepIdx = getWorkflowIndex(del.status);

            return (
              <Card key={del.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Metadata */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="font-extrabold text-base text-brand-textDark">{del.deliveryNumber}</h3>
                      {getStatusBadge(del.status)}
                    </div>
                    <p className="text-xs font-semibold text-brand-textDark">
                      Customer: <span className="font-normal text-brand-textMedium">{del.customer}</span>
                    </p>
                    <p className="text-xs text-brand-textMuted">
                      Destination: {del.destination} • Hub: {del.warehouseName}
                    </p>
                  </div>

                  {/* Right Action Button */}
                  <div className="shrink-0 flex items-center gap-3">
                    {del.status !== 'Validate' ? (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleNextStep(del)}
                        className="w-full md:w-auto px-6 py-3 font-bold"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        {del.status === 'Draft' && 'Start Picking →'}
                        {del.status === 'Pick' && 'Complete Picking & Pack →'}
                        {del.status === 'Pack' && 'Validate Consignment →'}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" />
                        Dispatched via {del.carrier}
                      </span>
                    )}
                  </div>
                </div>

                {/* Workflow Progress Bar */}
                <div className="mt-4 pt-4 border-t border-brand-border">
                  <div className="grid grid-cols-4 gap-2">
                    {statusWorkflow.map((st, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      return (
                        <div key={st} className="space-y-1">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-brand-caramel' : 'bg-brand-creamDark/60'
                            }`}
                          />
                          <p
                            className={`text-[10px] text-center font-semibold ${
                              isCompleted ? 'text-brand-caramel' : 'text-brand-textLight'
                            }`}
                          >
                            {st}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items to Pick */}
                <div className="mt-3 bg-brand-cream/40 rounded-xl p-3 border border-brand-border text-xs">
                  <span className="font-bold text-brand-textDark block mb-1.5">Shipment Line Items:</span>
                  <div className="space-y-1">
                    {del.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-brand-textMedium">
                        <span>• {it.productName} ({it.sku})</span>
                        <span className="font-bold text-brand-textDark">{it.quantity} Units</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
