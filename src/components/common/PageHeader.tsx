import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Breadcrumb } from '../../types/navigation';
import { Link } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  badge,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-brand-textMuted mb-1.5">
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-brand-textLight" />}
                {bc.path ? (
                  <Link
                    to={bc.path}
                    className="hover:text-brand-caramel transition-colors font-medium"
                  >
                    {bc.label}
                  </Link>
                ) : (
                  <span className="text-brand-textDark font-medium">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-brand-textDark tracking-tight">{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-brand-textMuted mt-1">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
