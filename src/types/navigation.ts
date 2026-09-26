import { ReactNode } from 'react';

export interface NavItem {
  name: string;
  path: string;
  icon: ReactNode;
  badge?: string | number;
  badgeColor?: 'caramel' | 'gold' | 'danger' | 'success';
}

export interface Breadcrumb {
  label: string;
  path?: string;
}
