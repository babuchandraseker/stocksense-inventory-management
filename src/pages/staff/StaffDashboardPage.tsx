import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  Receipt,
  Activity,
  PackagePlus,
  Sliders,
  Search,
  ArrowLeftRight,
  ClipboardCheck,
  Clock,
  ArrowRight,
  Truck,
  Building2,
} from 'lucide-react';

export const StaffDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    products,
    receipts,
    ledger,
    totalStockCount,
    lowStockCount,
  } = useInventory();

  const lowStockItems = products.filter(
    (p) => p.status === 'Low Stock' || p.status === 'Out of Stock'
  ).slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={`Hi, ${user?.name || 'Karthik'}!`}
        subtitle="Let's keep the inventory updated and moving smoothly."
        badge={
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-cream border border-brand-border text-xs font-semibold text-brand-textDark">
            <Building2 className="w-3.5 h-3.5 text-brand-caramel" />
            {user?.warehouseName || 'Central Logistics Hub'}
          </span>
        }
      />

      {/* 4 Focused Staff KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stock"
          value={totalStockCount.toLocaleString()}
          change="Available"
          trend="up"
          icon={<Boxes className="w-5 h-5 text-emerald-700" />}
          iconBgColor="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Low Stock"
          value={lowStockCount}
          change="Needs Attention"
          trend="down"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          iconBgColor="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Today's Receipts"
          value={receipts.filter((r) => r.status === 'Confirmed').length || 23}
          change="Completed"
          trend="up"
          icon={<Receipt className="w-5 h-5 text-amber-700" />}
          iconBgColor="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Today's Activities"
          value={ledger.length || 18}
          change="Logged"
          trend="neutral"
          icon={<Activity className="w-5 h-5 text-brand-caramel" />}
          iconBgColor="bg-brand-caramelLight text-brand-caramel"
        />
      </div>

      {/* QUICK ACTIONS SECTION (Most Prominent Feature on Staff UI) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base font-bold text-brand-textDark tracking-tight">Quick Actions</h3>
          <span className="text-xs text-brand-textMuted font-medium">Common Warehouse Operations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {/* Action 1: Create Receipt */}
          <button
            onClick={() => navigate('/staff/receive')}
            className="group p-5 rounded-2xl bg-brand-primary text-white shadow-warm hover:bg-brand-warm hover:shadow-warm-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-brand-sidebarBorder text-left flex flex-col justify-between h-36"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-3 rounded-xl bg-white/15 group-hover:bg-white/20 transition-colors">
                <PackagePlus className="w-6 h-6 text-amber-300" />
              </div>
              <ArrowRight className="w-4 h-4 text-brand-textLight group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">Receive Goods</h4>
              <p className="text-[11px] text-brand-textLight mt-0.5">Log inbound supplier consignments</p>
            </div>
          </button>

          {/* Action 2: Update Stock / Stock Count */}
          <button
            onClick={() => navigate('/staff/stock-count')}
            className="group p-5 rounded-2xl bg-brand-warm text-white shadow-warm hover:bg-brand-primary hover:shadow-warm-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-brand-sidebarBorder text-left flex flex-col justify-between h-36"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-3 rounded-xl bg-white/15 group-hover:bg-white/20 transition-colors">
                <ClipboardCheck className="w-6 h-6 text-amber-300" />
              </div>
              <ArrowRight className="w-4 h-4 text-brand-textLight group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">Stock Count</h4>
              <p className="text-[11px] text-brand-textLight mt-0.5">Reconcile physical inventory counts</p>
            </div>
          </button>

          {/* Action 3: View Inventory */}
          <button
            onClick={() => navigate('/staff/inventory')}
            className="group p-5 rounded-2xl bg-brand-caramel text-white shadow-warm hover:bg-brand-caramelHover hover:shadow-warm-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-brand-sidebarBorder text-left flex flex-col justify-between h-36"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-3 rounded-xl bg-white/15 group-hover:bg-white/20 transition-colors">
                <Search className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">View Inventory</h4>
              <p className="text-[11px] text-brand-cream mt-0.5">Search stock and bin locations</p>
            </div>
          </button>

          {/* Action 4: Create Transfer */}
          <button
            onClick={() => navigate('/staff/transfers')}
            className="group p-5 rounded-2xl bg-white text-brand-textDark shadow-warm hover:bg-brand-cream/50 hover:shadow-warm-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-brand-border text-left flex flex-col justify-between h-36"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-3 rounded-xl bg-brand-cream text-brand-caramel group-hover:bg-brand-caramel group-hover:text-white transition-colors">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-brand-textMuted group-hover:text-brand-textDark group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-textDark leading-tight">Create Transfer</h4>
              <p className="text-[11px] text-brand-textMuted mt-0.5">Move items between hubs or zones</p>
            </div>
          </button>

          {/* Action 5: Deliveries Dispatch */}
          <button
            onClick={() => navigate('/staff/deliveries')}
            className="group p-5 rounded-2xl bg-white text-brand-textDark shadow-warm hover:bg-brand-cream/50 hover:shadow-warm-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-brand-border text-left flex flex-col justify-between h-36"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-3 rounded-xl bg-brand-cream text-amber-700 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                <Truck className="w-6 h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-brand-textMuted group-hover:text-brand-textDark group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-textDark leading-tight">Pick & Deliver</h4>
              <p className="text-[11px] text-brand-textMuted mt-0.5">Process pick, pack & dispatch orders</p>
            </div>
          </button>
        </div>
      </div>

      {/* Two Columns: Recent Activity & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Timeline */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-caramel" />
                <h3 className="font-bold text-sm text-brand-textDark">Recent Activity</h3>
              </div>
              <button
                onClick={() => navigate('/staff/ledger')}
                className="text-xs text-brand-caramel font-bold hover:underline flex items-center gap-1"
              >
                <span>Full Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          }
          padded={false}
        >
          <div className="divide-y divide-brand-border/60">
            {ledger.slice(0, 5).map((act) => (
              <div key={act.id} className="p-3.5 flex items-center justify-between hover:bg-brand-cream/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-brand-cream shrink-0 text-brand-caramel">
                    {act.transactionType === 'RECEIPT' && <PackagePlus className="w-4 h-4" />}
                    {act.transactionType === 'DELIVERY' && <Truck className="w-4 h-4" />}
                    {act.transactionType.includes('TRANSFER') && <ArrowLeftRight className="w-4 h-4" />}
                    {act.transactionType === 'ADJUSTMENT' && <Sliders className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-textDark">{act.productName}</h4>
                    <p className="text-[11px] text-brand-textMuted">{act.transactionType} • Ref: {act.reference}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                      act.quantity > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {act.quantity > 0 ? `+${act.quantity}` : act.quantity} Units
                  </span>
                  <p className="text-[10px] text-brand-textMuted mt-0.5">{act.date.split(' ')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Low Stock Alerts (Staff focused format) */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-brand-textDark">Low Stock Alerts</h3>
              </div>
              <button
                onClick={() => navigate('/staff/inventory')}
                className="text-xs text-brand-caramel font-bold hover:underline flex items-center gap-1"
              >
                <span>View Inventory</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          }
          padded={false}
        >
          <div className="divide-y divide-brand-border/60">
            {lowStockItems.length === 0 ? (
              <p className="p-4 text-xs text-brand-textMuted text-center">All stock levels are optimal.</p>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-brand-cream/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        item.status === 'Out of Stock' ? 'bg-rose-500 ring-2 ring-rose-200' : 'bg-amber-500 ring-2 ring-amber-200'
                      }`}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-brand-textDark">{item.name}</h4>
                      <p className="text-[11px] text-brand-textMuted">SKU: {item.sku} • Min: {item.reorderLevel} {item.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-brand-textDark">{item.currentStock} remaining</p>
                      <p className="text-[10px] text-brand-textMuted">Reorder threshold: {item.reorderLevel}</p>
                    </div>
                    {item.status === 'Out of Stock' ? (
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
      </div>
    </div>
  );
};
