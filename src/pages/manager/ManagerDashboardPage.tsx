import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useInventory } from '../../context/InventoryContext';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Receipt as ReceiptIcon,
  Truck,
  ArrowRightLeft,
  XCircle,
  BarChart3,
  PieChart as PieIcon,
  Plus,
  Clock,
  ChevronRight,
  Warehouse,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const ManagerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    receipts,
    ledger,
    locationStocks,
    totalProductsCount,
    lowStockCount,
    outOfStockCount,
    pendingReceiptsCount,
    pendingDeliveriesCount,
    scheduledTransfersCount,
  } = useInventory();

  const [graphMode, setGraphMode] = useState<'product' | 'location'>('product');

  // Dynamic live stock data per product
  const stockByProductData = products.map((p) => ({
    name: p.name,
    sku: p.sku,
    quantity: p.currentStock,
    reorderLevel: p.reorderLevel,
    category: p.category,
    unit: p.unit,
  }));

  // Dynamic stock breakdown by location
  const stockByLocationData = React.useMemo(() => {
    const locMap: Record<string, number> = {};
    locationStocks.forEach((ls) => {
      locMap[ls.locationName] = (locMap[ls.locationName] || 0) + ls.quantity;
    });

    return Object.entries(locMap).map(([name, quantity]) => ({
      name,
      quantity,
    }));
  }, [locationStocks]);

  // Dynamic category distribution
  const categoryData = React.useMemo(() => {
    const rawMaterialsStock = products
      .filter((p) => p.category.toLowerCase().includes('raw'))
      .reduce((sum, p) => sum + p.currentStock, 0);

    const finishedGoodsStock = products
      .filter((p) => p.category.toLowerCase().includes('finish'))
      .reduce((sum, p) => sum + p.currentStock, 0);

    const total = rawMaterialsStock + finishedGoodsStock || 1;

    return [
      {
        name: 'Raw Materials',
        value: Math.round((rawMaterialsStock / total) * 100),
        units: rawMaterialsStock,
        color: '#9A4C1C', // Caramel
      },
      {
        name: 'Finished Goods',
        value: Math.round((finishedGoodsStock / total) * 100),
        units: finishedGoodsStock,
        color: '#D97706', // Gold / Amber
      },
    ];
  }, [products]);

  // Low stock products
  const lowStockItems = products.filter(
    (p) => p.currentStock <= p.reorderLevel
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Good morning, Admin!"
        subtitle="Here's what's happening with your inventory today."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/manager/products')}
            >
              Add Product
            </Button>
          </div>
        }
      />

      {/* 6 Required Dynamic KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Total Products in Stock */}
        <StatCard
          title="Products in Stock"
          value={totalProductsCount}
          change={`${products.length} catalog`}
          trend="neutral"
          icon={<Package className="w-5 h-5 text-brand-caramel" />}
          iconBgColor="bg-brand-caramelLight text-brand-caramel"
        />

        {/* 2. Low Stock Items */}
        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          change={lowStockCount > 0 ? "Requires reorder" : "Healthy"}
          trend={lowStockCount > 0 ? "down" : "neutral"}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          iconBgColor="bg-amber-50 text-amber-600"
        />

        {/* 3. Out of Stock Items */}
        <StatCard
          title="Out of Stock"
          value={outOfStockCount}
          change={outOfStockCount === 0 ? "Zero stockouts" : "Action needed"}
          trend={outOfStockCount > 0 ? "down" : "up"}
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
          iconBgColor="bg-rose-50 text-rose-600"
        />

        {/* 4. Pending Receipts */}
        <StatCard
          title="Pending Receipts"
          value={pendingReceiptsCount}
          change={`${receipts.length} total`}
          trend="neutral"
          icon={<ReceiptIcon className="w-5 h-5 text-emerald-700" />}
          iconBgColor="bg-emerald-50 text-emerald-700"
        />

        {/* 5. Pending Deliveries */}
        <StatCard
          title="Pending Deliveries"
          value={pendingDeliveriesCount}
          change="In fulfillment"
          trend="neutral"
          icon={<Truck className="w-5 h-5 text-blue-700" />}
          iconBgColor="bg-blue-50 text-blue-700"
        />

        {/* 6. Internal Transfers Scheduled */}
        <StatCard
          title="Transfers Scheduled"
          value={scheduledTransfersCount}
          change="Pending dispatch"
          trend="neutral"
          icon={<ArrowRightLeft className="w-5 h-5 text-purple-700" />}
          iconBgColor="bg-purple-50 text-purple-700"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stock Graph: Stock by Product */}
        <Card
          className="lg:col-span-2"
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-caramel" />
                <h3 className="font-bold text-sm text-brand-textDark">
                  {graphMode === 'product' ? 'Stock by Product (Current Available Quantity)' : 'Stock Availability by Location'}
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-brand-cream/80 p-1 rounded-lg border border-brand-border">
                <button
                  onClick={() => setGraphMode('product')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    graphMode === 'product' ? 'bg-white text-brand-textDark shadow-warm-sm' : 'text-brand-textMuted hover:text-brand-textDark'
                  }`}
                >
                  By Product
                </button>
                <button
                  onClick={() => setGraphMode('location')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    graphMode === 'location' ? 'bg-white text-brand-textDark shadow-warm-sm' : 'text-brand-textMuted hover:text-brand-textDark'
                  }`}
                >
                  By Location
                </button>
              </div>
            </div>
          }
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {graphMode === 'product' ? (
                <BarChart
                  data={stockByProductData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DFD5" />
                  <XAxis dataKey="name" stroke="#8C7B70" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8C7B70" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E8DFD5',
                      borderRadius: '12px',
                      boxShadow: '0 4px 14px -2px rgba(43, 24, 16, 0.10)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, _name: any, item: any) => [
                      `${val} ${item.payload.unit || ''} (Min: ${item.payload.reorderLevel})`,
                      'Available Stock',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="quantity"
                    name="Current Stock"
                    fill="#9A4C1C"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              ) : (
                <BarChart
                  data={stockByLocationData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DFD5" />
                  <XAxis dataKey="name" stroke="#8C7B70" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8C7B70" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E8DFD5',
                      borderRadius: '12px',
                      boxShadow: '0 4px 14px -2px rgba(43, 24, 16, 0.10)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} units/kg`, 'Location Total']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="quantity"
                    name="Total Quantity"
                    fill="#D97706"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Dynamic Category Distribution */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-brand-caramel" />
                <h3 className="font-bold text-sm text-brand-textDark">Category Distribution</h3>
              </div>
              <span className="text-xs text-brand-textMuted font-medium">By Quantity</span>
            </div>
          }
        >
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E8DFD5',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, _name: any, item: any) => [
                    `${val}% (${item.payload.units} total)`,
                    'Share',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-brand-border text-xs">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-brand-textDark font-medium truncate">{c.name}</span>
                <span className="text-brand-textMuted ml-auto">{c.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Stock Availability per Location Strip */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-brand-caramel" />
              <h3 className="font-bold text-sm text-brand-textDark">Stock Availability per Location</h3>
            </div>
            <button
              onClick={() => navigate('/manager/inventory')}
              className="text-xs text-brand-caramel font-bold hover:underline flex items-center gap-1"
            >
              <span>View Full Inventory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((prod) => {
            const locList = locationStocks.filter((ls) => ls.productId === prod.id);
            const sumLocationStock = locList.reduce((sum, ls) => sum + ls.quantity, 0);

            return (
              <div
                key={prod.id}
                className="bg-brand-cream/40 p-4 rounded-xl border border-brand-border/60 hover:border-brand-caramel/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-brand-textDark">{prod.name}</h4>
                    <p className="text-[11px] text-brand-textMuted">{prod.sku} • {prod.category}</p>
                  </div>
                  <Badge variant={prod.status === 'In Stock' ? 'success' : prod.status === 'Low Stock' ? 'warning' : 'danger'} size="sm">
                    {prod.currentStock} {prod.unit}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5 border-t border-brand-border/40 pt-2 text-xs">
                  {locList.length === 0 ? (
                    <div className="flex justify-between text-brand-textMuted text-[11px]">
                      <span>Main Warehouse</span>
                      <span>{prod.currentStock} {prod.unit}</span>
                    </div>
                  ) : (
                    locList.map((ls) => (
                      <div key={ls.id} className="flex justify-between text-[11px] text-brand-textMuted">
                        <span className="truncate pr-2">{ls.locationName}</span>
                        <span className="font-semibold text-brand-textDark shrink-0">{ls.quantity} {ls.unit}</span>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between pt-1 border-t border-dashed border-brand-border text-[11px] font-bold text-brand-primary">
                    <span>Total Calculated</span>
                    <span>{sumLocationStock || prod.currentStock} {prod.unit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bottom Grid: Low Stock Alerts, Recent Inbound/Outbound, Recent Ledger Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-brand-textDark">Stock Alerts & Reorder Points</h3>
              </div>
              <button
                onClick={() => navigate('/manager/inventory')}
                className="text-xs text-brand-caramel font-bold hover:underline flex items-center gap-1"
              >
                <span>View Inventory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          }
          padded={false}
        >
          <div className="divide-y divide-brand-border/60">
            {lowStockItems.length === 0 ? (
              <p className="p-4 text-xs text-emerald-700 bg-emerald-50/50 text-center font-medium">
                ✓ All items are above reorder thresholds
              </p>
            ) : (
              lowStockItems.map((p) => (
                <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-brand-cream/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-brand-cream flex items-center justify-center text-brand-caramel shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-brand-textDark truncate">{p.name}</h4>
                      <p className="text-[11px] text-brand-textMuted">{p.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold text-brand-textDark">{p.currentStock} {p.unit}</p>
                      <p className="text-[10px] text-brand-textMuted">Reorder: {p.reorderLevel}</p>
                    </div>
                    {p.currentStock === 0 ? (
                      <Badge variant="danger" size="sm" dot>Out</Badge>
                    ) : (
                      <Badge variant="warning" size="sm" dot>Low</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Consignment Receipts */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-brand-textDark">Incoming Consignments</h3>
              </div>
              <button
                onClick={() => navigate('/manager/receipts')}
                className="text-xs text-brand-caramel font-bold hover:underline flex items-center gap-1"
              >
                <span>Receipts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          }
          padded={false}
        >
          <div className="divide-y divide-brand-border/60">
            {receipts.slice(0, 4).map((r) => (
              <div key={r.id} className="p-3.5 flex items-center justify-between hover:bg-brand-cream/30 transition-colors">
                <div className="truncate">
                  <h4 className="text-xs font-bold text-brand-textDark">{r.receiptNumber}</h4>
                  <p className="text-[11px] text-brand-textMuted truncate">{r.supplier} • {r.items[0]?.productName || 'Items'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={r.status === 'Confirmed' ? 'success' : r.status === 'Waiting' ? 'warning' : 'neutral'} size="sm">
                    {r.totalQuantity} {r.items[0]?.unit || 'Units'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Real Stock Ledger Feed */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-caramel" />
                <h3 className="font-bold text-sm text-brand-textDark">Stock Ledger Trail</h3>
              </div>
              <button
                onClick={() => navigate('/manager/ledger')}
                className="text-xs text-brand-caramel font-bold hover:underline flex items-center gap-1"
              >
                <span>Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          }
          padded={false}
        >
          <div className="divide-y divide-brand-border/60">
            {ledger.slice(0, 5).map((entry) => (
              <div key={entry.id} className="p-3 flex items-center justify-between hover:bg-brand-cream/30 transition-colors">
                <div className="truncate">
                  <h4 className="text-xs font-bold text-brand-textDark truncate">
                    {entry.transactionType}: {entry.productName}
                  </h4>
                  <p className="text-[11px] text-brand-textMuted">
                    {entry.locationName || entry.warehouseName} • Ref: {entry.reference}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-bold ${
                      entry.quantity > 0 ? 'text-emerald-700' : entry.quantity < 0 ? 'text-rose-700' : 'text-brand-textMuted'
                    }`}
                  >
                    {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                  </span>
                  <p className="text-[10px] text-brand-textMuted">{entry.date.split(' ')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
