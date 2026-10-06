import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/lib/AuthContext'
import { ToastProvider } from '@/lib/ToastContext'
import { RequireAuth, RequireDomain, RequireAdmin } from '@/components/RouteGuards'
import { AppShell } from '@/components/layout/AppShell'
import { AdminShell } from '@/components/layout/AdminShell'
import { AgriAdminShell } from '@/components/layout/AgriAdminShell'
import { UiAutoTranslator } from '@/components/UiAutoTranslator'

import Landing from '@/pages/flow/Landing'
import Login from '@/pages/flow/Login'
import Signup from '@/pages/flow/Signup'
import LanguageSelect from '@/pages/flow/LanguageSelect'
import DomainSelect from '@/pages/flow/DomainSelect'
import Profile from '@/pages/flow/Profile'

import Home from '@/pages/customer/Home'
import Categories from '@/pages/customer/Categories'
import ProductDetail from '@/pages/customer/ProductDetail'
import Cart from '@/pages/customer/Cart'
import Wishlist from '@/pages/customer/Wishlist'
import Checkout from '@/pages/customer/Checkout'
import Orders from '@/pages/customer/Orders'
import Support from '@/pages/customer/Support'
import Assistant from '@/pages/customer/Assistant'

import AgriHome from '@/pages/agri/AgriHome'
import AgriShop from '@/pages/agri/AgriShop'
import Crops from '@/pages/agri/Crops'

import Dashboard from '@/pages/admin/Dashboard'
import AdminProducts from '@/pages/admin/Products'
import AdminCategories from '@/pages/admin/Categories'
import AdminOrders from '@/pages/admin/Orders'
import AdminCustomers from '@/pages/admin/Customers'
import AdminInventory from '@/pages/admin/Inventory'
import AdminDeals from '@/pages/admin/Deals'
import AdminReviews from '@/pages/admin/Reviews'
import AdminPayments from '@/pages/admin/Payments'
import AdminReports from '@/pages/admin/Reports'
import AdminBanners from '@/pages/admin/Banners'
import AdminSupportTickets from '@/pages/admin/SupportTickets'
import AdminSettings from '@/pages/admin/Settings'
import AdminKnowledgeBase from '@/pages/admin/KnowledgeBase'
import AdminConversations from '@/pages/admin/Conversations'

import AgriDashboard from '@/pages/agri-admin/Dashboard'
import AdminCrops from '@/pages/agri-admin/Crops'
import AdminCropIssues from '@/pages/agri-admin/CropIssues'
import AdminAdvisories from '@/pages/agri-admin/Advisories'
import AdminSchemes from '@/pages/agri-admin/Schemes'
import AgriReports from '@/pages/agri-admin/Reports'

export default function App() {
  return (
    <ToastProvider>
    <AuthProvider>
      <UiAutoTranslator />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<RequireAuth />}>
            <Route path="/language" element={<LanguageSelect />} />
            <Route path="/domain" element={<DomainSelect />} />
            <Route path="/profile" element={<Profile />} />

            <Route element={<AppShell />}>
              <Route element={<RequireDomain domain="ecommerce" />}>
                <Route path="/ecommerce" element={<Home />} />
                <Route path="/ecommerce/categories" element={<Categories />} />
              </Route>
              <Route element={<RequireDomain domain="agriculture" />}>
                <Route path="/agriculture" element={<AgriHome />} />
                <Route path="/agriculture/shop" element={<AgriShop />} />
                <Route path="/agriculture/crops" element={<Crops />} />
              </Route>

              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/support" element={<Support />} />
            </Route>

            <Route path="/assistant" element={<Assistant />} />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminShell />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProducts domain="ecommerce" />} />
              <Route path="categories" element={<AdminCategories domain="ecommerce" />} />
              <Route path="orders" element={<AdminOrders domain="ecommerce" />} />
              <Route path="customers" element={<AdminCustomers role="customer" title="Customers" />} />
              <Route path="inventory" element={<AdminInventory domain="ecommerce" />} />
              <Route path="deals" element={<AdminDeals domain="ecommerce" />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="knowledge-base" element={<AdminKnowledgeBase domain="ecommerce" />} />
              <Route path="conversations" element={<AdminConversations domain="ecommerce" />} />
              <Route path="support" element={<AdminSupportTickets role="customer" />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="/agri-admin" element={<AgriAdminShell />}>
              <Route index element={<AgriDashboard />} />
              <Route path="farmers" element={<AdminCustomers role="farmer" title="Farmers" />} />
              <Route path="crops" element={<AdminCrops />} />
              <Route path="products" element={<AdminProducts domain="agriculture" />} />
              <Route path="categories" element={<AdminCategories domain="agriculture" />} />
              <Route path="orders" element={<AdminOrders domain="agriculture" />} />
              <Route path="crop-issues" element={<AdminCropIssues />} />
              <Route path="advisories" element={<AdminAdvisories />} />
              <Route path="schemes" element={<AdminSchemes />} />
              <Route path="knowledge-base" element={<AdminKnowledgeBase domain="agriculture" />} />
              <Route path="conversations" element={<AdminConversations domain="agriculture" />} />
              <Route path="support" element={<AdminSupportTickets role="farmer" />} />
              <Route path="reports" element={<AgriReports />} />
              <Route
                path="settings"
                element={<AdminSettings defaults={{ name: 'AgriMart', tagline: 'Support Farmers, Build a Better Tomorrow', email: 'support@agrimart.com', phone: '1800-765-4321' }} />}
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  )
}
