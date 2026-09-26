import React, { useState } from 'react';
import { SearchBar } from '../common/SearchBar';
import { UserProfileMenu } from './UserProfileMenu';
import { Bell, Menu, Calendar } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface TopbarProps {
  onMenuToggle?: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, title }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const handleNotificationClick = () => {
    showToast({
      type: 'info',
      title: 'Notifications',
      message: 'You have 3 low-stock alert notifications pending review.',
    });
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-brand-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-warm-sm">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-brand-textDark hover:bg-brand-cream transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Global Search Bar */}
        <div className="w-full max-w-md hidden sm:block">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search products, suppliers, SKU..."
            showShortcut
          />
        </div>

        {title && (
          <div className="sm:hidden font-bold text-base text-brand-textDark truncate">
            {title}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Date Display (from design) */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-cream/60 border border-brand-border text-xs font-semibold text-brand-textMedium">
          <Calendar className="w-3.5 h-3.5 text-brand-caramel" />
          <span>{formattedDate}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={handleNotificationClick}
          className="relative p-2 rounded-xl text-brand-textMedium hover:text-brand-textDark hover:bg-brand-cream transition-colors border border-transparent hover:border-brand-border"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-600 ring-2 ring-white animate-pulse" />
        </button>

        <div className="h-6 w-px bg-brand-border hidden sm:block" />

        {/* User Menu */}
        <UserProfileMenu />
      </div>
    </header>
  );
};
