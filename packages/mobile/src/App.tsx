import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MobileLayout, SubpageLayout } from './layout/MobileLayout'
import { AddressEditPage } from './pages/AddressEditPage'
import { AddressListPage } from './pages/AddressListPage'
import { BillDetailPage } from './pages/BillDetailPage'
import { BillsPage } from './pages/BillsPage'
import { CartPage } from './pages/CartPage'
import { CartUnavailablePage } from './pages/CartUnavailablePage'
import { CheckoutPage } from './pages/CheckoutPage'
import { DishPage } from './pages/DishPage'
import { HomePage } from './pages/HomePage'
import { MerchantHomePage } from './pages/merchant/MerchantHomePage'
import { MerchantMinePage } from './pages/merchant/MerchantMinePage'
import { MerchantOrdersPage } from './pages/merchant/MerchantOrdersPage'
import { MinePage } from './pages/MinePage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { OrdersPage } from './pages/OrdersPage'
import { PayPage } from './pages/PayPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { RefundPage } from './pages/RefundPage'
import { RiderHomePage } from './pages/rider/RiderHomePage'
import { RiderMinePage } from './pages/rider/RiderMinePage'
import { RiderTasksPage } from './pages/rider/RiderTasksPage'
import { ServicePage } from './pages/ServicePage'
import { ShopsPage } from './pages/ShopsPage'
import { StorePage } from './pages/StorePage'
import { TrackPage } from './pages/TrackPage'
import { AppProvider } from './store/AppStore'
import './App.css'

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MobileLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shops" element={<ShopsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="mine" element={<MinePage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="m" element={<MerchantHomePage />} />
            <Route path="m/orders" element={<MerchantOrdersPage />} />
            <Route path="m/mine" element={<MerchantMinePage />} />
            <Route path="r" element={<RiderHomePage />} />
            <Route path="r/tasks" element={<RiderTasksPage />} />
            <Route path="r/mine" element={<RiderMinePage />} />
          </Route>
          <Route element={<SubpageLayout />}>
            <Route path="store/:id" element={<StorePage />} />
            <Route path="dish/:id" element={<DishPage />} />
            <Route path="address" element={<AddressListPage />} />
            <Route path="address/new" element={<AddressEditPage />} />
            <Route path="address/:id" element={<AddressEditPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="cart/unavailable" element={<CartUnavailablePage />} />
            <Route path="pay/:id" element={<PayPage />} />
            <Route path="order/:id" element={<OrderDetailPage />} />
            <Route path="track/:id" element={<TrackPage />} />
            <Route path="refund/:id" element={<RefundPage />} />
            <Route path="bills" element={<BillsPage />} />
            <Route path="bills/:id" element={<BillDetailPage />} />
            <Route path="service" element={<ServicePage />} />
            <Route path="service/:id" element={<ServicePage />} />
            <Route path="privacy" element={<PrivacyPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
