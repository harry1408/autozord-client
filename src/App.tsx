import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from '@/store/theme.store';
import { useAuthStore } from '@/store/auth.store';
import api from '@/services/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/layouts/AppLayout';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CustomersPage from '@/pages/customers/CustomersPage';
import CustomerDetailPage from '@/pages/customers/CustomerDetailPage';
import VehiclesPage from '@/pages/vehicles/VehiclesPage';
import VehicleDetailPage from '@/pages/vehicles/VehicleDetailPage';
import RepairOrdersPage from '@/pages/repairOrders/RepairOrdersPage';
import RepairOrderDetailPage from '@/pages/repairOrders/RepairOrderDetailPage';
import EstimatesPage from '@/pages/estimates/EstimatesPage';
import EstimateDetailPage from '@/pages/estimates/EstimateDetailPage';
import InvoicesPage from '@/pages/invoices/InvoicesPage';
import InvoiceDetailPage from '@/pages/invoices/InvoiceDetailPage';
import PaymentsPage from '@/pages/payments/PaymentsPage';
import TechniciansPage from '@/pages/technicians/TechniciansPage';
import TechnicianDetailPage from '@/pages/technicians/TechnicianDetailPage';
import InspectionsPage from '@/pages/inspections/InspectionsPage';
import InspectionDetailPage from '@/pages/inspections/InspectionDetailPage';
import InventoryPage from '@/pages/inventory/InventoryPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import CustomerPortalPage from '@/pages/portal/CustomerPortalPage';
import AdminLayout from '@/layouts/AdminLayout';
import ShopsListPage from '@/pages/admin/ShopsListPage';
import ShopDetailPage from '@/pages/admin/ShopDetailPage';
import UsersListPage from '@/pages/admin/UsersListPage';
import { Role } from '@/types';

const SHOP_STAFF_ROLES: Role[] = ['SHOP_ADMIN', 'MANAGER', 'TECHNICIAN', 'RECEPTIONIST'];

function RoleAwareRedirect() {
  const { user } = useAuthStore();
  if (user?.role === 'GLOBAL_ADMIN') return <Navigate to="/admin/shops" replace />;
  if (user?.role === 'CUSTOMER') return <Navigate to="/portal" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { theme } = useThemeStore();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const { accessToken, logout } = useAuthStore.getState();
    if (!accessToken) { setAuthReady(true); return; }
    api.get('/auth/me')
      .then(() => setAuthReady(true))
      .catch(() => { logout(); setAuthReady(true); });
  }, []);

  if (!authReady) return null;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/portal"
        element={
          <ProtectedRoute roles={['CUSTOMER']}>
            <CustomerPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['GLOBAL_ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/shops" replace />} />
        <Route path="shops" element={<ShopsListPage />} />
        <Route path="shops/:id" element={<ShopDetailPage />} />
        <Route path="users" element={<UsersListPage />} />
      </Route>
      <Route
        path="/"
        element={
          <ProtectedRoute roles={SHOP_STAFF_ROLES}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="repair-orders" element={<RepairOrdersPage />} />
        <Route path="repair-orders/:id" element={<RepairOrderDetailPage />} />
        <Route path="estimates" element={<EstimatesPage />} />
        <Route path="estimates/:id" element={<EstimateDetailPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="technicians" element={<TechniciansPage />} />
        <Route path="technicians/:id" element={<TechnicianDetailPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="inspections/:id" element={<InspectionDetailPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<RoleAwareRedirect />} />
    </Routes>
  );
}
