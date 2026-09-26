import React from 'react';
import { NavLink } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { NavItem } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ArrowRight, Headphones, ChevronRight } from 'lucide-react';

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
        bg-[#26190F] text-[#F8F5F2] border-r border-[#3D291A]
        h-full flex flex-col justify-between transition-all duration-300 select-none
        ${collapsed ? 'w-20' : 'w-64'}
        ${className}
      `}
    >
      {/* Top Header / Logo */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="h-16 flex items-center px-5 border-b border-[#3D291A]/80">
          <BrandLogo size="md" variant="light" showText={!collapsed} />
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={({ isActive }) => `
                group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
                ${
                  isActive
                    ? 'bg-[#E2DDD7] text-[#3D291A] shadow-md font-bold'
                    : 'text-[#D5CCC5] hover:text-white hover:bg-[#332215]'
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
                      ${isActive ? 'text-[#3D291A]' : 'text-[#A3968C] group-hover:text-white'}
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
                          isActive
                            ? 'bg-[#3D291A] text-white'
                            : 'bg-[#895A38]/40 text-[#E2DDD7] border border-[#895A38]'
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

        {/* Sidebar Promo Card: "Organize Track Grow" */}
        {!collapsed && (
          <div className="p-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#3D291A] to-[#1E110A] border border-[#4E3C2F] p-4 text-white shadow-lg group">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay group-hover:scale-105 transition-transform duration-500"
                style={{ backgroundImage: `url('/assets/warehouse_hero.jpg')` }}
              />
              <div className="relative z-10">
                <span className="text-[10px] uppercase tracking-wider text-[#D5CCC5] font-semibold">
                  StockSense Core
                </span>
                <h4 className="font-serif text-sm font-bold text-white mt-1 leading-snug">
                  Organize <br />
                  <span className="italic font-normal text-[#E2DDD7]">Track</span> Grow
                </h4>
                <div className="mt-3 flex items-center justify-between">
                  <div className="w-7 h-7 rounded-full bg-[#E2DDD7] text-[#3D291A] flex items-center justify-center shadow-sm">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-[#D5CCC5]">Real-time Sync</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Support Card & User Profile */}
      <div className="p-3 border-t border-[#3D291A]/80 bg-[#1E110A]">
        {!collapsed && (
          <div className="mb-2 p-2.5 rounded-xl bg-[#26190F] border border-[#3D291A] flex items-center justify-between text-xs text-[#D5CCC5] hover:border-[#895A38] transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-[#895A38]" />
              <div className="text-left">
                <p className="text-[11px] font-bold text-white">Need Help?</p>
                <p className="text-[9px] text-[#A3968C]">Contact Support</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#7F7065]" />
          </div>
        )}

        <div
          className={`
            flex items-center gap-2.5 p-2 rounded-xl bg-[#26190F] border border-[#3D291A]
            ${collapsed ? 'justify-center p-1.5' : ''}
          `}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-[#895A38] shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#3D291A] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#895A38]/50 font-serif">
              {user?.name?.[0] || 'U'}
            </div>
          )}

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-[#A3968C] truncate capitalize">
                {user?.role === 'manager' ? 'Admin' : 'Staff'} &middot; {user?.email?.split('@')[0]}
              </p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#A3968C] hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
