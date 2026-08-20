import { Route, Routes } from "react-router-dom";
import StoreLayout from "../layouts/StoreLayout.jsx";
import HomePage from "../pages/HomePage.jsx";
import CatalogPage from "../pages/CatalogPage.jsx";
import ProductDetailsPage from "../pages/ProductDetailsPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

/**
 * Public storefront routes.
 *
 * The information architecture also defines /login, /register, /cart,
 * /checkout, /orders, /account and the /admin area. Those are added by the
 * days that implement them - an unimplemented route registered now would only
 * render a blank page, so anything not listed here falls through to the 404.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<CatalogPage />} />
        <Route path="products/:slug" element={<ProductDetailsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
