import React from 'react';
import { NavLink } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { NavItem } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

export interface SidebarProps {
  items: NavItem[];
  collapsed?: boolean;
  onItemClick?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  collapsed = false,
  onItemClick,
  className = '',
}) => {
  const { user, logout } = useAuth();

  return (
    <aside
      className={`
        bg-brand-sidebar text-brand-textLight border-r border-brand-sidebarBorder
        h-full flex flex-col justify-between transition-all duration-300 select-none
        ${collapsed ? 'w-20' : 'w-64'}
        ${className}
      `}
    >
      {/* Top Header / Logo */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-brand-sidebarBorder/70">
          <BrandLogo size="md" variant="light" showText={!collapsed} />
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={({ isActive }) => `
                group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-caramel to-amber-800 text-white shadow-warm shadow-amber-950/40 font-semibold'
                    : 'text-brand-textLight hover:text-white hover:bg-brand-sidebarHover'
                }
                ${collapsed ? 'justify-center px-0' : ''}
              `}
              title={collapsed ? item.name : undefined}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`
                      shrink-0 transition-colors
                      ${isActive ? 'text-white' : 'text-brand-textMuted group-hover:text-amber-400'}
                    `}
                  >
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span className="flex-1 truncate tracking-tight">{item.name}</span>
                  )}

                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`
                        px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${
                          item.badgeColor === 'danger'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : item.badgeColor === 'gold'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-brand-caramel/30 text-amber-200 border border-amber-600/30'
                        }
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Footer Pill */}
      <div className="p-3 border-t border-brand-sidebarBorder/80 bg-brand-darkest/40">
        <div
          className={`
            flex items-center gap-3 p-2 rounded-xl bg-brand-sidebarHover/60 border border-brand-sidebarBorder/40
            ${collapsed ? 'justify-center p-1.5' : ''}
          `}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border border-amber-600/40 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-caramel text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
          )}

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              </div>
              <p className="text-[11px] text-brand-textMuted truncate">
                {user?.email || (user?.role === 'manager' ? 'admin@stocksense.com' : 'staff@stocksense.com')}
              </p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-brand-textMuted hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
