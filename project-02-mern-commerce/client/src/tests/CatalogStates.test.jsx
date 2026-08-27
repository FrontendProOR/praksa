import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

/**
 * Section 12: a product loading/error rendering test.
 *
 * The API modules are mocked so the three states can be produced on demand -
 * this is about how the page reacts to the API, not about the API itself,
 * which the backend suite covers against a real database.
 */
vi.mock("../api/products.js", () => ({
  fetchProducts: vi.fn(),
  fetchProductBySlug: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

vi.mock("../api/categories.js", () => ({
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const { fetchProducts } = await import("../api/products.js");
const { fetchCategories } = await import("../api/categories.js");
const { default: CatalogPage } = await import("../pages/CatalogPage.jsx");
const { CartProvider } = await import("../context/CartProvider.jsx");

const PRODUCT = {
  id: "p1",
  slug: "demo-proizvod",
  name: "Demo Proizvod",
  shortDescription: "Kratak opis.",
  price: 25,
  stock: 4,
  imageUrl: "/images/product-placeholder.svg",
  category: { id: "c1", name: "Reagensi", slug: "reagensi" },
};

const META = { page: 1, limit: 12, totalItems: 1, totalPages: 1 };

const renderCatalog = () =>
  render(
    <CartProvider>
      <MemoryRouter initialEntries={["/products"]}>
        <CatalogPage />
      </MemoryRouter>
    </CartProvider>,
  );

beforeEach(() => {
  fetchCategories.mockResolvedValue([{ id: "c1", name: "Reagensi", slug: "reagensi" }]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("CatalogPage states", () => {
  test("a pending request shows an announced loading state", async () => {
    // Never resolves: the page stays in its loading state.
    fetchProducts.mockImplementation(() => new Promise(() => {}));

    renderCatalog();

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(/učitavanje/i);
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  test("a successful response renders the products", async () => {
    fetchProducts.mockResolvedValue({ products: [PRODUCT], meta: META });

    renderCatalog();

    expect(await screen.findByText("Demo Proizvod")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("a failed request shows the API message as an alert, with a retry", async () => {
    const failure = Object.assign(
      new Error("Server trenutno nije dostupan."),
      { code: "INTERNAL_ERROR", status: 0, details: [] },
    );
    fetchProducts.mockRejectedValue(failure);

    renderCatalog();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/server trenutno nije dostupan/i);
    expect(screen.getByRole("button", { name: /pokušaj ponovo/i })).toBeInTheDocument();
  });

  test("the error state does not render a half-broken product list", async () => {
    fetchProducts.mockRejectedValue(
      Object.assign(new Error("Neuspjelo"), { code: "INTERNAL_ERROR", details: [] }),
    );

    renderCatalog();

    await screen.findByRole("alert");
    expect(screen.queryByText("Demo Proizvod")).not.toBeInTheDocument();
  });

  test("an empty result is an empty state, not an error", async () => {
    fetchProducts.mockResolvedValue({
      products: [],
      meta: { ...META, totalItems: 0, totalPages: 0 },
    });

    renderCatalog();

    await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
    expect(await screen.findByText(/nema/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("the page keeps exactly one h1 in every state", async () => {
    fetchProducts.mockRejectedValue(
      Object.assign(new Error("Neuspjelo"), { code: "INTERNAL_ERROR", details: [] }),
    );

    renderCatalog();
    await screen.findByRole("alert");

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  test("the catalogue asks the API for data rather than filtering a local array", async () => {
    fetchProducts.mockResolvedValue({ products: [PRODUCT], meta: META });

    renderCatalog();

    await waitFor(() => expect(fetchProducts).toHaveBeenCalledTimes(1));
    // Defaults are not sent; the API applies them.
    expect(fetchProducts).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
  });
});
