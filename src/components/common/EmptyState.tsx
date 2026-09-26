import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <PackageOpen className="w-10 h-10 text-brand-caramel" />,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-brand-border border-dashed p-10
        flex flex-col items-center justify-center text-center max-w-lg mx-auto
        ${className}
      `}
    >
      <div className="p-4 rounded-2xl bg-brand-caramelLight/60 mb-4 inline-flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-brand-textDark">{title}</h3>
      <p className="text-sm text-brand-textMuted mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
};
