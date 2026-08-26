import { Route, Routes } from "react-router-dom";
import StoreLayout from "../layouts/StoreLayout.jsx";
import HomePage from "../pages/HomePage.jsx";
import CatalogPage from "../pages/CatalogPage.jsx";
import ProductDetailsPage from "../pages/ProductDetailsPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import CartPage from "../pages/CartPage.jsx";
import CheckoutPage from "../pages/CheckoutPage.jsx";
import OrdersPage from "../pages/OrdersPage.jsx";
import OrderDetailsPage from "../pages/OrderDetailsPage.jsx";
import AccountPage from "../pages/AccountPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import AdminProductsPage from "../pages/admin/AdminProductsPage.jsx";
import AdminProductFormPage from "../pages/admin/AdminProductFormPage.jsx";
import AdminCategoriesPage from "../pages/admin/AdminCategoriesPage.jsx";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminRoute from "./AdminRoute.jsx";

/**
 * Application routes.
 *
 * Public: home, catalogue, product details, login, register, cart.
 * Signed in: checkout, orders, order details, account.
 * Admin: dashboard, product management, categories and orders.
 *
 * The cart itself is public - a guest can fill one - but checkout requires a
 * session, so the guard sends them to sign in and back again. The admin
 * screens are nested inside one guard and one layout, so the navigation is
 * written once and the guard cannot be forgotten on a new screen. Anything
 * unknown falls through to the 404.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<CatalogPage />} />
        <Route path="products/:slug" element={<ProductDetailsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="cart" element={<CartPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailsPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<AdminProductFormPage />} />
            <Route path="products/:id/edit" element={<AdminProductFormPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
