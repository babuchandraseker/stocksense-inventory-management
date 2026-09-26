import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import { ManagerLayout } from '../components/layout/ManagerLayout';
import { StaffLayout } from '../components/layout/StaffLayout';

// Pages - Auth
import { LoginPage } from '../pages/auth/LoginPage';

// Pages - Manager (Phase 2)
import { ManagerDashboardPage } from '../pages/manager/ManagerDashboardPage';
import { ProductsPage } from '../pages/manager/ProductsPage';
import { InventoryPage } from '../pages/manager/InventoryPage';
import { ReceiptsPage } from '../pages/manager/ReceiptsPage';
import { DeliveriesPage } from '../pages/manager/DeliveriesPage';
import { TransfersPage } from '../pages/manager/TransfersPage';
import { AdjustmentsPage } from '../pages/manager/AdjustmentsPage';
import { StockLedgerPage } from '../pages/manager/StockLedgerPage';
import { WarehousePage } from '../pages/manager/WarehousePage';
import { ManagerProfilePage } from '../pages/manager/ManagerProfilePage';

// Pages - Staff (Phase 3)
import { StaffDashboardPage } from '../pages/staff/StaffDashboardPage';
import { StaffInventoryPage } from '../pages/staff/StaffInventoryPage';
import { StaffReceivePage } from '../pages/staff/StaffReceivePage';
import { StaffDeliveriesPage } from '../pages/staff/StaffDeliveriesPage';
import { StaffTransfersPage } from '../pages/staff/StaffTransfersPage';
import { StaffStockCountPage } from '../pages/staff/StaffStockCountPage';
import { StaffLedgerPage } from '../pages/staff/StaffLedgerPage';
import { StaffProfilePage } from '../pages/staff/StaffProfilePage';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      {/* Root redirect based on auth */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={role === 'manager' ? '/manager/dashboard' : '/staff/dashboard'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Auth Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={role === 'manager' ? '/manager/dashboard' : '/staff/dashboard'} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Manager Routes (Phase 2) */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRole="manager">
            <ManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="deliveries" element={<DeliveriesPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="adjustments" element={<AdjustmentsPage />} />
        <Route path="ledger" element={<StockLedgerPage />} />
        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="profile" element={<ManagerProfilePage />} />
      </Route>

      {/* Staff Routes (Phase 3) */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRole="staff">
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboardPage />} />
        <Route path="inventory" element={<StaffInventoryPage />} />
        <Route path="receive" element={<StaffReceivePage />} />
        <Route path="deliveries" element={<StaffDeliveriesPage />} />
        <Route path="transfers" element={<StaffTransfersPage />} />
        <Route path="stock-count" element={<StaffStockCountPage />} />
        <Route path="ledger" element={<StaffLedgerPage />} />
        <Route path="profile" element={<StaffProfilePage />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
