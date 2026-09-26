import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  iconBgColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  iconBgColor = 'bg-brand-caramelLight text-brand-caramel',
  className = '',
}) => {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-brand-border p-5 shadow-warm
        hover:shadow-warm-md hover:border-brand-borderDark transition-all duration-200
        flex flex-col justify-between
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${iconBgColor} shrink-0`}>
          {icon}
        </div>
        {change && (
          <div
            className={`
              inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold
              ${
                trend === 'up'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : trend === 'down'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-brand-cream text-brand-textMedium border border-brand-border'
              }
            `}
          >
            {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {trend === 'neutral' && <Minus className="w-3 h-3" />}
            <span>{change}</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-2xl font-bold text-brand-textDark tracking-tight">{value}</h3>
        <p className="text-xs font-medium text-brand-textMuted mt-1">{title}</p>
      </div>
    </div>
  );
};
