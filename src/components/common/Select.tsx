import React, { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      placeholder,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-brand-textDark tracking-tight">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full rounded-xl bg-white border text-sm text-brand-textDark
              appearance-none pl-3.5 pr-10 py-2.5 transition-all duration-200 outline-none cursor-pointer
              ${
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-brand-border focus:border-brand-caramel focus:ring-2 focus:ring-brand-caramelLight/50'
              }
              disabled:bg-brand-cream/50 disabled:text-brand-textMuted disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-brand-textLight">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-brand-textDark">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 w-4 h-4 text-brand-textMuted pointer-events-none" />
        </div>
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-brand-textMuted">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
