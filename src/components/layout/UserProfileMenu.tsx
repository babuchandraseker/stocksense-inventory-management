import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Dropdown, DropdownItem } from '../common/Dropdown';
import { User, LogOut, RefreshCw, ShieldCheck, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserProfileMenu: React.FC = () => {
  const { user, role, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const dropdownItems: (DropdownItem | 'divider')[] = [
    {
      id: 'profile',
      label: 'View Profile',
      icon: <User className="w-4 h-4 text-brand-textMuted" />,
      onClick: () => {
        navigate(role === 'manager' ? '/manager/profile' : '/staff/profile');
      },
    },
    {
      id: 'switch_role',
      label: role === 'manager' ? 'Switch to Staff UI' : 'Switch to Manager UI',
      icon: <RefreshCw className="w-4 h-4 text-brand-caramel" />,
      onClick: () => {
        const nextRole = role === 'manager' ? 'staff' : 'manager';
        switchRole(nextRole);
        navigate(nextRole === 'manager' ? '/manager/dashboard' : '/staff/dashboard');
      },
    },
    'divider',
    {
      id: 'logout',
      label: 'Sign Out',
      icon: <LogOut className="w-4 h-4 text-red-500" />,
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const trigger = (
    <div className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-brand-cream/80 transition-colors cursor-pointer border border-transparent hover:border-brand-border">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover border border-brand-border shadow-warm-sm"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xs">
          {user.name?.[0] || 'U'}
        </div>
      )}

      <div className="hidden sm:flex flex-col text-left">
        <span className="text-xs font-bold text-brand-textDark leading-tight flex items-center gap-1.5">
          {user.name}
          {role === 'manager' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          )}
        </span>
        <span className="text-[10px] text-brand-textMuted font-medium uppercase tracking-wider">
          {role === 'manager' ? 'Manager / Admin' : 'Warehouse Staff'}
        </span>
      </div>
    </div>
  );

  return <Dropdown trigger={trigger} items={dropdownItems} align="right" />;
};
