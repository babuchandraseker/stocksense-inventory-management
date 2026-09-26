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
import { Delivery, DeliveryStatus } from '../../types/inventory';
import { Truck, Plus, Eye, ArrowRight } from 'lucide-react';

export const DeliveriesPage: React.FC = () => {
  const { deliveries, createDelivery, advanceDeliveryStatus, products, warehouses } = useInventory();
  const { showToast } = useToast();

  const [searchValue, setSearchValue] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);

  // Form
  const [customer, setCustomer] = useState('');
  const [destination, setDestination] = useState('');
  const [warehouseId, setWarehouseId] = useState('wh-main');
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(5);
  const [carrier, setCarrier] = useState('BlueDart Express');

  const statusWorkflow: DeliveryStatus[] = ['Draft', 'Pick', 'Pack', 'Validate'];

  const getWorkflowIndex = (st: DeliveryStatus) => statusWorkflow.indexOf(st);

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !destination.trim()) {
      showToast({ type: 'error', title: 'Missing Information', message: 'Customer name and destination are required.' });
      return;
    }

    const prod = products.find((p) => p.id === selectedProdId) || products[0];
    const wh = warehouses.find((w) => w.id === warehouseId) || warehouses[0];

    const newDel = createDelivery({
      customer,
      destination,
      warehouseId: wh.id,
      warehouseName: wh.name,
      orderDate: new Date().toLocaleDateString('en-CA'),
      status: 'Draft',
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity,
          pickedQuantity: 0,
        },
      ],
      carrier,
      trackingNumber: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
      createdBy: 'Admin',
    });

    showToast({
      type: 'success',
      title: 'Outbound Delivery Created',
      message: `${newDel.deliveryNumber} for ${newDel.customer} is registered.`,
    });

    setIsCreateModalOpen(false);
    setCustomer('');
    setDestination('');
  };

  const handleAdvanceWorkflow = (del: Delivery) => {
    advanceDeliveryStatus(del.id);
    const nextIdx = Math.min(statusWorkflow.length - 1, getWorkflowIndex(del.status) + 1);
    const nextState = statusWorkflow[nextIdx];

    showToast({
      type: 'success',
      title: 'Workflow Advanced',
      message: `${del.deliveryNumber} moved to stage: "${nextState}".`,
    });

    if (activeDelivery && activeDelivery.id === del.id) {
      setActiveDelivery({ ...activeDelivery, status: nextState });
    }
  };

  // Filter
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const matchesSearch =
        d.deliveryNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
        d.customer.toLowerCase().includes(searchValue.toLowerCase()) ||
        d.destination.toLowerCase().includes(searchValue.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || d.status === selectedStatus;
      const matchesWarehouse = selectedWarehouse === 'all' || d.warehouseId === selectedWarehouse;

      return matchesSearch && matchesStatus && matchesWarehouse;
    });
  }, [deliveries, searchValue, selectedStatus, selectedWarehouse]);

  const totalPages = Math.ceil(filteredDeliveries.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDeliveries.slice(start, start + pageSize);
  }, [filteredDeliveries, currentPage, pageSize]);

  const getStatusBadge = (status: DeliveryStatus) => {
    const map: Record<DeliveryStatus, { variant: BadgeVariant; text: string }> = {
      Draft: { variant: 'neutral', text: '1. Draft' },
      Pick: { variant: 'warning', text: '2. Picking' },
      Pack: { variant: 'caramel', text: '3. Packing' },
      Validate: { variant: 'success', text: '4. Validated' },
    };
    const s = map[status] || { variant: 'neutral', text: status };
    return <Badge variant={s.variant} size="sm">{s.text}</Badge>;
  };

  const columns: Column<Delivery>[] = [
    {
      key: 'deliveryNumber',
      header: 'Delivery ID',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-cream flex items-center justify-center text-brand-caramel">
            <Truck className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="font-bold text-brand-textDark text-xs">{item.deliveryNumber}</p>
            <p className="text-[10px] text-brand-textMuted">{item.carrier}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer & Destination',
      render: (item) => (
        <div>
          <p className="text-xs font-bold text-brand-textDark">{item.customer}</p>
          <p className="text-[11px] text-brand-textMuted truncate max-w-xs">{item.destination}</p>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse',
      render: (item) => <span className="text-xs text-brand-textMuted">{item.warehouseName}</span>,
    },
    {
      key: 'orderDate',
      header: 'Order Date',
      render: (item) => <span className="text-xs text-brand-textMuted">{item.orderDate}</span>,
    },
    {
      key: 'totalQuantity',
      header: 'Quantity',
      align: 'center',
      render: (item) => <span className="text-xs font-bold text-brand-textDark">{item.totalQuantity} Units</span>,
    },
    {
      key: 'status',
      header: 'Workflow Stage',
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          {getStatusBadge(item.status)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setActiveDelivery(item);
              setIsDetailsModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-brand-textMuted hover:text-brand-textDark hover:bg-brand-cream transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {item.status !== 'Validate' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAdvanceWorkflow(item)}
              className="text-[11px] py-1 px-2 text-brand-caramel"
            >
              Next Step →
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Deliveries & Dispatch"
        subtitle="Manage customer order fulfillment through the Draft → Pick → Pack → Validate workflow."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Delivery
          </Button>
        }
      />

      {/* Workflow Stepper Guide Card */}
      <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-warm">
        <p className="text-xs font-bold text-brand-textDark mb-3">Delivery Fulfillment Pipeline</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: '1. Draft', desc: 'Order logged & queued' },
            { step: '2. Pick', desc: 'Items retrieved from bins' },
            { step: '3. Pack', desc: 'Consignment packed & labeled' },
            { step: '4. Validate', desc: 'Quality checked & dispatched' },
          ].map((s, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-brand-cream/50 border border-brand-border text-center">
              <p className="text-xs font-bold text-brand-textDark">{s.step}</p>
              <p className="text-[10px] text-brand-textMuted mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search delivery orders by ID, customer..."
        filters={[
          {
            id: 'status',
            value: selectedStatus,
            onChange: setSelectedStatus,
            placeholder: 'All Stages',
            options: [
              { value: 'all', label: 'All Stages' },
              { value: 'Draft', label: '1. Draft' },
              { value: 'Pick', label: '2. Pick' },
              { value: 'Pack', label: '3. Pack' },
              { value: 'Validate', label: '4. Validate' },
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
          setSelectedStatus('all');
          setSelectedWarehouse('all');
        }}
      />

      {/* Deliveries Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredDeliveries.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      />

      {/* CREATE DELIVERY MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Outbound Delivery"
        description="Schedule a customer fulfillment shipment."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateDelivery} className="space-y-4">
          <Input
            label="Customer Name *"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="e.g. Apex Technologies Pvt Ltd"
            required
          />
          <Input
            label="Shipping Destination Address *"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Plot 12, Tech Zone, Bangalore"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Source Warehouse *"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
            <Select
              label="Carrier / Logistics Partner"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              options={[
                { value: 'BlueDart Express', label: 'BlueDart Express' },
                { value: 'Delhivery Logistics', label: 'Delhivery Logistics' },
                { value: 'FedEx Priority', label: 'FedEx Priority' },
                { value: 'Self Pickup', label: 'Self Pickup' },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Product Item *"
              value={selectedProdId}
              onChange={(e) => setSelectedProdId(e.target.value)}
              options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.currentStock} in stock)` }))}
            />
            <Input
              label="Order Quantity *"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
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
              Create Shipment
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELIVERY DETAILS MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Delivery: ${activeDelivery?.deliveryNumber}`}
        description={`Customer: ${activeDelivery?.customer}`}
        maxWidth="xl"
      >
        {activeDelivery && (
          <div className="space-y-4">
            {/* Visual Workflow Tracker */}
            <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-brand-textDark">Workflow Status</span>
                {getStatusBadge(activeDelivery.status)}
              </div>
              <div className="grid grid-cols-4 gap-2 pt-2">
                {statusWorkflow.map((st, i) => {
                  const currentIdx = getWorkflowIndex(activeDelivery.status);
                  const isDone = i <= currentIdx;
                  return (
                    <div
                      key={st}
                      className={`h-2 rounded-full transition-all ${
                        isDone ? 'bg-brand-caramel' : 'bg-brand-creamDark'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Delivery Metadata */}
            <div className="p-4 rounded-xl bg-brand-cream/30 border border-brand-border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Destination:</span>
                <span className="font-semibold text-brand-textDark text-right">{activeDelivery.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Fulfillment Warehouse:</span>
                <span className="font-semibold text-brand-textDark">{activeDelivery.warehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Tracking Number:</span>
                <span className="font-bold text-brand-textDark font-mono">{activeDelivery.trackingNumber}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-brand-border rounded-xl overflow-hidden divide-y divide-brand-border/60">
              <div className="bg-brand-cream/40 px-3 py-2 text-[11px] font-bold text-brand-textMuted uppercase flex justify-between">
                <span>Items in Shipment</span>
                <span>Ordered Quantity</span>
              </div>
              {activeDelivery.items.map((it, idx) => (
                <div key={idx} className="p-3 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold text-brand-textDark">{it.productName}</p>
                    <p className="text-[11px] text-brand-textMuted">{it.sku}</p>
                  </div>
                  <span className="font-extrabold text-brand-textDark">{it.quantity} Units</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-brand-border">
              {activeDelivery.status !== 'Validate' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAdvanceWorkflow(activeDelivery)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Advance to Next Stage
                </Button>
              ) : (
                <Badge variant="success" size="md">Shipment Fully Validated & Dispatched</Badge>
              )}
              <Button
                variant="outline"
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
