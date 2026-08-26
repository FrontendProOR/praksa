import { NavLink, Outlet } from "react-router-dom";
import Container from "../components/Container.jsx";
import { useAuth } from "../context/auth-context.js";
import "../styles/admin.css";

/**
 * Shell for the administration area.
 *
 * Rendered inside the storefront layout, so the site header and footer stay
 * where they are; what this adds is an admin bar that makes it obvious the
 * user is in the management area and gives one place to switch between its
 * screens. Nested routes render into the outlet, so the navigation is written
 * once rather than repeated on every page.
 *
 * This is presentation. The route is guarded by `AdminRoute` for the user's
 * convenience, and every admin request is authorised again on the server.
 */
const ADMIN_LINKS = [
  { to: "/admin", label: "Pregled", end: true },
  { to: "/admin/products", label: "Proizvodi" },
  { to: "/admin/categories", label: "Kategorije" },
  { to: "/admin/orders", label: "Narudžbe" },
];

function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="admin">
      <div className="admin__bar">
        <Container className="admin__bar-inner">
          <p className="admin__badge">
            Administracija
            <span className="visually-hidden"> - prijavljeni kao {user.email}</span>
          </p>

          <nav className="admin__nav" aria-label="Administracija">
            <ul>
              {ADMIN_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `admin__nav-link${isActive ? " admin__nav-link--active" : ""}`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <NavLink className="admin__exit" to="/products">
            Nazad na prodavnicu
          </NavLink>
        </Container>
      </div>

      <Outlet />
    </div>
  );
}

export default AdminLayout;
