import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-red-50/70 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto
        ${className}
      `}
    >
      <div className="p-3 bg-red-100 text-red-600 rounded-full inline-flex mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-red-900">{title}</h3>
      <p className="text-xs text-red-700 mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="border-red-300 text-red-800 hover:bg-red-100"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
