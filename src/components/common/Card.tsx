import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  hoverable = false,
  padded = true,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-brand-border shadow-warm
        ${hoverable ? 'hover:shadow-warm-md hover:border-brand-borderDark transition-all duration-200' : ''}
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={padded ? 'p-6' : ''}>{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-brand-cream/30 border-t border-brand-border rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
};
