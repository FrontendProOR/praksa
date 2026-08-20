import { Outlet } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

/**
 * Shared storefront shell: skip link, header, the routed page inside <main>,
 * and the footer. Every public route renders through this layout.
 */
function StoreLayout() {
  return (
    <>
      <a className="skip-link" href="#glavni-sadrzaj">
        Preskoči na glavni sadržaj
      </a>

      <Header />

      <main id="glavni-sadrzaj" tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

export default StoreLayout;
