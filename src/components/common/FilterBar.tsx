import React from 'react';
import { SearchBar } from './SearchBar';
import { Select, SelectOption } from './Select';
import { RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface FilterConfig {
  id: string;
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}

export interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onResetFilters?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  onResetFilters,
  actions,
  className = '',
}) => {
  const hasActiveFilters = Boolean(
    (searchValue && searchValue.length > 0) ||
      filters.some((f) => f.value && f.value !== '' && f.value !== 'all')
  );

  return (
    <div
      className={`
        bg-white p-3.5 rounded-2xl border border-brand-border shadow-warm-sm
        flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3
        ${className}
      `}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
        {onSearchChange !== undefined && (
          <div className="max-w-md w-full">
            <SearchBar
              value={searchValue || ''}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>
        )}

        {filters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {filters.map((filter) => (
              <div key={filter.id} className="min-w-[140px] flex-1 sm:flex-none">
                <Select
                  options={filter.options}
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  placeholder={filter.placeholder}
                  className="py-2 text-xs"
                />
              </div>
            ))}

            {hasActiveFilters && onResetFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="text-brand-textMuted hover:text-brand-textDark text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-brand-border">
          {actions}
        </div>
      )}
    </div>
  );
};
