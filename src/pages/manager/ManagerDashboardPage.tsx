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
  Boxes,
  AlertTriangle,
  Receipt,
  CircleDollarSign,
  Users,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Plus,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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
    totalProductsCount,
    totalStockCount,
    lowStockCount,
    totalStockValue,
  } = useInventory();

  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('month');

  // Realistic trend chart data
  const trendData = [
    { name: 'Jan', stockIn: 450, stockOut: 320, balance: 1200 },
    { name: 'Feb', stockIn: 580, stockOut: 410, balance: 1370 },
    { name: 'Mar', stockIn: 490, stockOut: 380, balance: 1480 },
    { name: 'Apr', stockIn: 720, stockOut: 520, balance: 1680 },
    { name: 'May', stockIn: 890, stockOut: 640, balance: 1930 },
    { name: 'Jun', stockIn: 780, stockOut: 600, balance: 2110 },
    { name: 'Jul', stockIn: 950, stockOut: 710, balance: 2350 },
    { name: 'Aug', stockIn: 880, stockOut: 690, balance: 2540 },
    { name: 'Sep', stockIn: 1040, stockOut: 780, balance: 2800 },
  ];

  // Stock movements breakdown data
  const movementData = [
    { name: 'Mon', Received: 120, Issued: 90, Adjusted: 5 },
    { name: 'Tue', Received: 210, Issued: 140, Adjusted: -2 },
    { name: 'Wed', Received: 180, Issued: 160, Adjusted: 8 },
    { name: 'Thu', Received: 290, Issued: 195, Adjusted: -4 },
    { name: 'Fri', Received: 240, Issued: 210, Adjusted: 3 },
    { name: 'Sat', Received: 90, Issued: 60, Adjusted: 0 },
  ];

  // Category distribution data
  const categoryData = [
    { name: 'Electronics', value: 45, color: '#9A4C1C' }, // Brand caramel
    { name: 'Accessories', value: 30, color: '#D97706' }, // Gold
    { name: 'Furniture', value: 15, color: '#4E2C1D' },   // Warm brown
    { name: 'Logistics', value: 10, color: '#E5982A' },   // Amber
  ];

  const lowStockItems = products.filter(
    (p) => p.status === 'Low Stock' || p.status === 'Out of Stock'
  ).slice(0, 4);

  const formattedStockValue = `₹${(totalStockValue / 100000).toFixed(1)}L`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Good morning, Admin!"
        subtitle="Here's what's happening with your inventory today."
        actions={
          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-brand-cream/80 p-1 rounded-xl border border-brand-border">
              {(['today', 'week', 'month'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`
                    px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all
                    ${timeframe === t ? 'bg-white text-brand-textDark shadow-warm-sm' : 'text-brand-textMuted hover:text-brand-textDark'}
                  `}
                >
                  {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>

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

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Products"
          value={totalProductsCount}
          change="+12%"
          trend="up"
          icon={<Package className="w-5 h-5 text-brand-caramel" />}
          iconBgColor="bg-brand-caramelLight text-brand-caramel"
        />
        <StatCard
          title="Total Stock"
          value={totalStockCount.toLocaleString()}
          change="-8%"
          trend="down"
          icon={<Boxes className="w-5 h-5 text-emerald-700" />}
          iconBgColor="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          change="-10%"
          trend="down"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          iconBgColor="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Today's Receipts"
          value="23"
          change="+5%"
          trend="up"
          icon={<Receipt className="w-5 h-5 text-amber-700" />}
          iconBgColor="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Stock Value"
          value={formattedStockValue}
          change="+12%"
          trend="up"
          icon={<CircleDollarSign className="w-5 h-5 text-brand-primary" />}
          iconBgColor="bg-brand-cream text-brand-primary"
        />
        <StatCard
          title="Active Staff"
          value="6"
          change="0%"
          trend="neutral"
          icon={<Users className="w-5 h-5 text-blue-700" />}
          iconBgColor="bg-blue-50 text-blue-700"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Trend Chart */}
        <Card
          className="lg:col-span-2"
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-caramel" />
                <h3 className="font-bold text-sm text-brand-textDark">Inventory Trend</h3>
              </div>
              <Badge variant="success" size="sm">+14.2% Growth</Badge>
            </div>
          }
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStockIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9A4C1C" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#9A4C1C" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorStockOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
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
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="stockIn" name="Inbound (Units)" stroke="#9A4C1C" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStockIn)" />
                <Area type="monotone" dataKey="stockOut" name="Outbound (Units)" stroke="#D97706" strokeWidth={2} fillOpacity={1} fill="url(#colorStockOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Distribution */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-brand-caramel" />
                <h3 className="font-bold text-sm text-brand-textDark">Category Distribution</h3>
              </div>
              <span className="text-xs text-brand-textMuted font-medium">By Volume</span>
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
                  formatter={(val: any) => [`${val}%`, 'Share']}
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

      {/* Stock Movements Bar Chart */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-caramel" />
              <h3 className="font-bold text-sm text-brand-textDark">Stock Movements Breakdown</h3>
            </div>
            <span className="text-xs text-brand-textMuted font-medium">Daily Inbound vs Outbound</span>
          </div>
        }
      >
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={movementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DFD5" />
              <XAxis dataKey="name" stroke="#8C7B70" fontSize={11} tickLine={false} />
              <YAxis stroke="#8C7B70" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E8DFD5',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Received" fill="#9A4C1C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Issued" fill="#D97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Bottom Grid: Low Stock Products, Recent Receipts, Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Products */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm text-brand-textDark">Low Stock Alerts</h3>
              </div>
              <button
                onClick={() => navigate('/manager/inventory')}
                className="text-xs text-brand-caramel font-bold hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          }
          padded={false}
        >
          <div className="divide-y divide-brand-border/60">
            {lowStockItems.length === 0 ? (
              <p className="p-4 text-xs text-brand-textMuted text-center">No low stock items</p>
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
                      <p className="text-xs font-bold text-brand-textDark">{p.currentStock} left</p>
                      <p className="text-[10px] text-brand-textMuted">Min: {p.reorderLevel}</p>
                    </div>
                    {p.status === 'Out of Stock' ? (
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

        {/* Recent Receipts */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-brand-textDark">Recent Receipts</h3>
              </div>
              <button
                onClick={() => navigate('/manager/receipts')}
                className="text-xs text-brand-caramel font-bold hover:underline flex items-center gap-1"
              >
                <span>View All</span>
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
                  <p className="text-[11px] text-brand-textMuted truncate">{r.supplier}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-brand-textMuted">{r.receiptDate}</span>
                  <Badge variant={r.status === 'Confirmed' ? 'success' : r.status === 'Waiting' ? 'warning' : 'neutral'} size="sm">
                    {r.totalQuantity} Units
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity Feed */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-caramel" />
                <h3 className="font-bold text-sm text-brand-textDark">Recent Activity</h3>
              </div>
              <button
                onClick={() => navigate('/manager/ledger')}
                className="text-xs text-brand-caramel font-bold hover:underline flex items-center gap-1"
              >
                <span>Audit Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          }
          padded={false}
        >
          <div className="divide-y divide-brand-border/60">
            {ledger.slice(0, 4).map((entry) => (
              <div key={entry.id} className="p-3.5 flex items-center justify-between hover:bg-brand-cream/30 transition-colors">
                <div className="truncate">
                  <h4 className="text-xs font-bold text-brand-textDark truncate">
                    {entry.transactionType}: {entry.productName}
                  </h4>
                  <p className="text-[11px] text-brand-textMuted">Ref: {entry.reference}</p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-bold ${
                      entry.quantity > 0 ? 'text-emerald-700' : 'text-rose-700'
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
