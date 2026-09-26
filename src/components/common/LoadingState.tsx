import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center p-12 text-center
        ${className}
      `}
    >
      <div className="p-3 rounded-2xl bg-brand-caramelLight/50 text-brand-caramel mb-3">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-brand-textDark">{message}</p>
      <p className="text-xs text-brand-textMuted mt-0.5">Please wait a moment</p>
    </div>
  );
};
