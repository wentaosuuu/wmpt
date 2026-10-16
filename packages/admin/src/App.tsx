import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './layout/AdminLayout'
import { TicketsPage } from './pages/aftersale/AftersalePages'
import { DashboardPage } from './pages/DashboardPage'
import { TradeFlowPage } from './pages/finance/FinancePages'
import { LoginPage } from './pages/LoginPage'
import { StoreApplyPage, StoreAuditPage, StoresPage } from './pages/merchant/MerchantPages'
import { StaffPage } from './pages/merchant/StaffPage'
import { OrderManagePage } from './pages/order/OrderManagePage'
import { CancelAuditPage } from './pages/order/OrderPages'
import { CategoriesPage, DishesPage, PackingPage, SpecsPage, StockPage } from './pages/product/ProductPages'
import { ProfilePage } from './pages/ProfilePage'
import { RidersPage } from './pages/rider/RiderPages'
import {
  CuisineCategoriesPage,
  DeptsPage,
  RolesPage,
  UsersPage,
} from './pages/system/SystemPages'
import { AdminProvider, useAdmin } from './store/AdminStore'
import './App.css'

function Guard() {
  const { user } = useAdmin()
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function GlobalToast() {
  const { toast } = useAdmin()
  if (!toast) return null
  return <div className="toast">{toast}</div>
}

function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <GlobalToast />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Guard />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />

              <Route path="merchants/apply" element={<StoreApplyPage />} />
              <Route path="merchants/audit" element={<StoreAuditPage />} />
              <Route path="merchants/stores" element={<StoresPage />} />
              <Route path="merchants/staff" element={<StaffPage />} />
              <Route path="merchants/listing" element={<Navigate to="/merchants/stores" replace />} />
              <Route path="merchants/hours" element={<Navigate to="/merchants/stores" replace />} />
              <Route path="merchants/qualification" element={<Navigate to="/merchants/audit" replace />} />

              <Route path="products/dishes" element={<DishesPage />} />
              <Route path="products/categories" element={<CategoriesPage />} />
              <Route path="products/specs" element={<SpecsPage />} />
              <Route path="products/stock" element={<StockPage />} />
              <Route path="products/packing" element={<PackingPage />} />

              <Route path="orders" element={<OrderManagePage />} />
              <Route path="orders/list" element={<Navigate to="/orders" replace />} />
              <Route path="orders/cancel" element={<CancelAuditPage />} />
              <Route path="orders/cancel-rules" element={<Navigate to="/orders/cancel" replace />} />
              <Route path="fulfill/accept" element={<Navigate to="/orders" replace />} />
              <Route path="fulfill/prep" element={<Navigate to="/orders" replace />} />
              <Route path="fulfill/handover" element={<Navigate to="/orders" replace />} />

              <Route path="delivery/coverage" element={<Navigate to="/merchants/stores" replace />} />
              <Route path="delivery/exception" element={<Navigate to="/merchants/stores" replace />} />
              <Route path="delivery/fail" element={<Navigate to="/merchants/stores" replace />} />

              <Route path="riders" element={<RidersPage />} />
              <Route path="riders/apply" element={<Navigate to="/riders" replace />} />
              <Route path="riders/audit" element={<Navigate to="/riders" replace />} />
              <Route path="delivery/dispatch" element={<Navigate to="/merchants/stores" replace />} />
              <Route path="delivery/track" element={<Navigate to="/merchants/stores" replace />} />

              <Route path="aftersale/tickets" element={<TicketsPage />} />
              <Route path="aftersale/refund" element={<Navigate to="/aftersale/tickets" replace />} />
              <Route path="aftersale/complaint" element={<Navigate to="/aftersale/tickets" replace />} />

              <Route path="finance/trades" element={<TradeFlowPage />} />
              <Route path="finance/fee" element={<Navigate to="/finance/trades" replace />} />
              <Route path="finance/payment" element={<Navigate to="/finance/trades" replace />} />
              <Route path="finance/merchant" element={<Navigate to="/finance/trades" replace />} />
              <Route path="finance/delivery" element={<Navigate to="/finance/trades" replace />} />
              <Route path="finance/reconcile" element={<Navigate to="/finance/trades" replace />} />

              <Route path="ops/pilot" element={<Navigate to="/merchants/stores" replace />} />
              <Route path="ops/privacy" element={<Navigate to="/" replace />} />

              <Route path="system/users" element={<UsersPage />} />
              <Route path="system/depts" element={<DeptsPage />} />
              <Route path="system/roles" element={<RolesPage />} />
              <Route path="system/cuisines" element={<CuisineCategoriesPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminProvider>
  )
}

export default App
