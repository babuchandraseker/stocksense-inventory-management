import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  badge?: string | number;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: (DropdownItem | 'divider')[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 min-w-[190px] rounded-xl bg-white border border-brand-border
            shadow-warm-lg py-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-150
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          {items.map((item, index) => {
            if (item === 'divider') {
              return <div key={`divider-${index}`} className="my-1 border-t border-brand-border" />;
            }

            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-3.5 py-2 text-xs flex items-center justify-between gap-2.5 transition-colors
                  ${
                    item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-brand-textDark hover:bg-brand-cream/60'
                  }
                  ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-2">
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand-creamDark text-brand-textDark">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
