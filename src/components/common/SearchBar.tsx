import React, { InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  showShortcut?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  showShortcut = false,
  placeholder = 'Search products, suppliers, SKU...',
  className = '',
  ...props
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="absolute left-3.5 w-4 h-4 text-brand-textMuted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-brand-cream/50 hover:bg-white focus:bg-white border border-brand-border rounded-xl pl-10 pr-12 py-2 text-sm text-brand-textDark placeholder:text-brand-textLight transition-all duration-200 outline-none focus:border-brand-caramel focus:ring-2 focus:ring-brand-caramelLight/50"
        {...props}
      />
      <div className="absolute right-3 flex items-center gap-1.5">
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              onClear?.();
            }}
            className="p-1 text-brand-textMuted hover:text-brand-textDark rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {showShortcut && !value && (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-brand-textMuted bg-brand-creamDark/60 border border-brand-border rounded">
            ⌘K
          </kbd>
        )}
      </div>
    </div>
  );
};
