import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useInventory } from '../../context/InventoryContext';
import { Warehouse } from '../../types/inventory';
import {
  Warehouse as WarehouseIcon,
  MapPin,
  User,
  Eye,
} from 'lucide-react';

export const WarehousePage: React.FC = () => {
  const { warehouses, products } = useInventory();
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleOpenDetails = (wh: Warehouse) => {
    setSelectedWarehouse(wh);
    setIsDetailsModalOpen(true);
  };

  const getWarehouseProducts = (whId: string) => {
    return products.filter((p) => p.warehouseId === whId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Warehouse Infrastructure"
        subtitle="Manage storage facilities, floor capacity, bin allocations, and regional distribution depots."
      />

      {/* Warehouse Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((wh) => {
          const whProducts = getWarehouseProducts(wh.id);
          const currentTotalStock = whProducts.reduce((sum, p) => sum + p.currentStock, 0);
          const occupancy = Math.min(100, Math.round((currentTotalStock / wh.capacity) * 100));

          return (
            <Card
              key={wh.id}
              hoverable
              header={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-caramelLight flex items-center justify-center text-brand-caramel shrink-0">
                      <WarehouseIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-brand-textDark">{wh.name}</h3>
                      <p className="text-[11px] text-brand-textMuted font-mono">{wh.code}</p>
                    </div>
                  </div>
                  <Badge variant={wh.status === 'Active' ? 'success' : 'warning'} size="sm" dot>
                    {wh.status}
                  </Badge>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Location */}
                <div className="flex items-start gap-2 text-xs text-brand-textMedium">
                  <MapPin className="w-4 h-4 text-brand-caramel shrink-0 mt-0.5" />
                  <span>{wh.address}</span>
                </div>

                {/* Metrics Stats */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-brand-cream/50 rounded-xl border border-brand-border text-xs">
                  <div>
                    <span className="text-brand-textMuted block text-[11px]">Assigned SKUs</span>
                    <span className="font-bold text-base text-brand-textDark">{whProducts.length} Items</span>
                  </div>
                  <div>
                    <span className="text-brand-textMuted block text-[11px]">Stored Units</span>
                    <span className="font-bold text-base text-brand-caramel">{currentTotalStock} Units</span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-semibold">
                    <span className="text-brand-textMuted">Occupancy Capacity:</span>
                    <span className="text-brand-textDark">{occupancy}% ({currentTotalStock} / {wh.capacity})</span>
                  </div>
                  <div className="w-full h-2.5 bg-brand-cream rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        occupancy > 80 ? 'bg-amber-600' : 'bg-brand-caramel'
                      }`}
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                </div>

                {/* Manager Contact */}
                <div className="pt-3 border-t border-brand-border flex items-center justify-between text-xs text-brand-textMuted">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-textLight" />
                    <span>{wh.manager}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetails(wh)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    className="text-xs py-1 px-2.5"
                  >
                    View Facility
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* WAREHOUSE DETAILS MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedWarehouse?.name}
        description={`Code: ${selectedWarehouse?.code} | ${selectedWarehouse?.location}`}
        maxWidth="2xl"
      >
        {selectedWarehouse && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border">
                <span className="text-[11px] text-brand-textMuted block">Facility Manager</span>
                <span className="text-sm font-bold text-brand-textDark">{selectedWarehouse.manager}</span>
                <span className="text-[11px] text-brand-textMuted block mt-0.5">{selectedWarehouse.contactNumber}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border">
                <span className="text-[11px] text-brand-textMuted block">Total Volume</span>
                <span className="text-sm font-bold text-brand-textDark">{selectedWarehouse.capacity.toLocaleString()} Max Units</span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">High Density Storage</span>
              </div>
              <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border">
                <span className="text-[11px] text-brand-textMuted block">Status</span>
                <div className="mt-1">
                  <Badge variant={selectedWarehouse.status === 'Active' ? 'success' : 'warning'} size="sm" dot>
                    {selectedWarehouse.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stored Inventory in this Warehouse */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-brand-textDark">Active Stock in this Hub</h4>
                <span className="text-xs text-brand-textMuted">
                  {getWarehouseProducts(selectedWarehouse.id).length} Products
                </span>
              </div>

              <div className="border border-brand-border rounded-xl overflow-hidden divide-y divide-brand-border/60 max-h-56 overflow-y-auto">
                {getWarehouseProducts(selectedWarehouse.id).length === 0 ? (
                  <p className="p-4 text-xs text-brand-textMuted text-center">No products currently assigned to this warehouse.</p>
                ) : (
                  getWarehouseProducts(selectedWarehouse.id).map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between text-xs hover:bg-brand-cream/20">
                      <div>
                        <p className="font-bold text-brand-textDark">{p.name}</p>
                        <p className="text-[11px] text-brand-textMuted">{p.sku} • {p.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-brand-textDark">{p.currentStock} {p.unit}</span>
                        <p className="text-[10px] text-brand-textMuted">Min: {p.reorderLevel}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-brand-border">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close Facility View
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
