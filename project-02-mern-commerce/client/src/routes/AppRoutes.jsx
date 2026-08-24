import { Route, Routes } from "react-router-dom";
import StoreLayout from "../layouts/StoreLayout.jsx";
import HomePage from "../pages/HomePage.jsx";
import CatalogPage from "../pages/CatalogPage.jsx";
import ProductDetailsPage from "../pages/ProductDetailsPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import AccountPage from "../pages/AccountPage.jsx";
import AdminPage from "../pages/AdminPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminRoute from "./AdminRoute.jsx";

/**
 * Application routes.
 *
 * Public: home, catalogue, product details, login, register.
 * Signed in: account.
 * Admin: the admin area.
 *
 * `/cart`, `/checkout`, `/orders` and the admin management screens belong to
 * later work and are not registered yet - an unimplemented route would only
 * render a blank page, so anything unknown falls through to the 404.
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

        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<AccountPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
