import React from 'react';
import { PageHeader } from './PageHeader';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { Clock, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  moduleName: string;
  icon?: React.ReactNode;
  userRole?: 'manager' | 'staff';
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  subtitle,
  moduleName,
  icon,
  userRole = 'manager',
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: userRole === 'manager' ? 'Manager' : 'Staff', path: userRole === 'manager' ? '/manager/dashboard' : '/staff/dashboard' },
          { label: title },
        ]}
        badge={
          <Badge variant="caramel" size="sm">
            Phase 2 Module
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(userRole === 'manager' ? '/manager/dashboard' : '/staff/dashboard')}
          >
            Back to Dashboard
          </Button>
        }
      />

      <Card className="text-center py-16 px-6">
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-caramelLight flex items-center justify-center text-brand-caramel mb-4 shadow-warm-sm">
            {icon || <Clock className="w-8 h-8" />}
          </div>

          <h3 className="text-xl font-bold text-brand-textDark">{title} Module</h3>
          <p className="text-sm text-brand-textMuted mt-2 leading-relaxed">
            The <b>{moduleName}</b> business logic, forms, and data models are scheduled for implementation in Phase 2 as per the specification.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-brand-cream/60 border border-brand-border text-left w-full text-xs text-brand-textMedium space-y-2">
            <div className="flex items-center gap-2 font-semibold text-brand-textDark">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Phase 1 Frontend Foundation Ready</span>
            </div>
            <p className="text-brand-textMuted">
              Routing, navigation active states, brown design system tokens, responsive drawers, and layout containers are operational for this route.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
