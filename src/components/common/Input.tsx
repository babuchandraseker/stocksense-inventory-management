import React, { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isPassword = false,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const actualType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-brand-textDark tracking-tight">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-brand-textMuted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={actualType}
            className={`
              w-full rounded-xl bg-white border text-sm text-brand-textDark placeholder:text-brand-textLight
              transition-all duration-200 outline-none
              ${leftIcon ? 'pl-10' : 'pl-3.5'}
              ${rightIcon || isPassword ? 'pr-10' : 'pr-3.5'}
              py-2.5
              ${
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-brand-border focus:border-brand-caramel focus:ring-2 focus:ring-brand-caramelLight/50'
              }
              disabled:bg-brand-cream/50 disabled:text-brand-textMuted disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1 text-brand-textMuted hover:text-brand-textDark transition-colors rounded"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : (
            rightIcon && (
              <div className="absolute right-3.5 flex items-center pointer-events-none text-brand-textMuted">
                {rightIcon}
              </div>
            )
          )}
        </div>
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-brand-textMuted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
