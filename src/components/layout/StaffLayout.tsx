import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NavItem } from '../../types/navigation';
import {
  LayoutDashboard,
  Boxes,
  PackagePlus,
  Truck,
  ArrowLeftRight,
  ClipboardCheck,
  BookOpen,
  User,
  X,
} from 'lucide-react';

const STAFF_NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/staff/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Inventory', path: '/staff/inventory', icon: <Boxes className="w-5 h-5" />, badge: 14, badgeColor: 'danger' },
  { name: 'Receive Goods', path: '/staff/receive', icon: <PackagePlus className="w-5 h-5" /> },
  { name: 'Deliveries', path: '/staff/deliveries', icon: <Truck className="w-5 h-5" /> },
  { name: 'Transfers', path: '/staff/transfers', icon: <ArrowLeftRight className="w-5 h-5" /> },
  { name: 'Stock Count', path: '/staff/stock-count', icon: <ClipboardCheck className="w-5 h-5" /> },
  { name: 'Stock Ledger', path: '/staff/ledger', icon: <BookOpen className="w-5 h-5" /> },
  { name: 'Profile', path: '/staff/profile', icon: <User className="w-5 h-5" /> },
];

export const StaffLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const currentItem = STAFF_NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.path)
  );

  return (
    <div className="flex h-screen bg-brand-offwhite text-brand-textDark overflow-hidden">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar items={STAFF_NAV_ITEMS} />
      </div>

      {/* Mobile / Tablet Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-brand-darkest/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile / Tablet Drawer Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="relative h-full">
          <Sidebar
            items={STAFF_NAV_ITEMS}
            onItemClick={() => setMobileMenuOpen(false)}
            className="w-full h-full shadow-2xl"
          />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar
          onMenuToggle={() => setMobileMenuOpen(true)}
          title={currentItem?.name || 'StockSense Staff'}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-radial-warm">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
