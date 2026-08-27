import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Container from "../../components/Container.jsx";
import FormField from "../../components/FormField.jsx";
import { ErrorState, LoadingState } from "../../components/StateViews.jsx";
import { describedBy } from "../../utils/aria.js";
import { useApiResource } from "../../hooks/useApiResource.js";
import { fetchCategories } from "../../api/categories.js";
import { fetchAdminProductById } from "../../api/admin.js";
import { createProduct, updateProduct } from "../../api/products.js";
import "../../styles/admin.css";

/**
 * Create and edit form for a product.
 *
 * One component serves both routes: the fields and the validation are the
 * same, and the API's update endpoint expects the full body anyway.
 *
 * Numbers are sent as numbers, not as the strings the inputs produce. The
 * server's rules stay the server's: the client checks only what it can see
 * (required fields, sane numbers) and renders whatever the API reports per
 * field - a duplicate SKU, a compare-at price below the price, an unknown
 * category - rather than trying to predict them.
 */
const EMPTY = {
  name: "", sku: "", shortDescription: "", description: "", category: "",
  price: "", compareAtPrice: "", stock: "0", imageUrl: "", tags: "",
  featured: false, active: true,
};

/** Turns a product from the API into form values. */
function toFormValues(product) {
  return {
    name: product.name ?? "",
    sku: product.sku ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    category: product.category?.id ?? product.category ?? "",
    price: String(product.price ?? ""),
    compareAtPrice: product.compareAtPrice == null ? "" : String(product.compareAtPrice),
    stock: String(product.stock ?? 0),
    imageUrl: product.imageUrl ?? "",
    tags: (product.tags ?? []).join(", "),
    featured: Boolean(product.featured),
    active: product.active !== false,
  };
}

function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const categories = useApiResource(({ signal }) => fetchCategories({ signal }), []);
  // The admin listing is the only place an inactive product can be read from.
  const existing = useApiResource(
    ({ signal }) => (isEdit ? fetchAdminProductById(id, { signal }) : Promise.resolve(null)),
    [id],
  );

  const [values, setValues] = useState(EMPTY);
  const [loadedId, setLoadedId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inFlightRef = useRef(false);
  const errorRef = useRef(null);

  // Fill the form once the product being edited has arrived.
  const product = isEdit ? existing.data : null;
  if (isEdit && product && loadedId !== id) {
    setLoadedId(id);
    setValues(toFormValues(product));
  }

  useEffect(() => {
    if (formError) errorRef.current?.focus();
  }, [formError]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
    if (fieldErrors[name]) {
      setFieldErrors((previous) => {
        const next = { ...previous };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errors = {};
    if (!values.name.trim()) errors.name = "Naziv je obavezan.";
    if (!values.sku.trim()) errors.sku = "Šifra artikla je obavezna.";
    if (!values.shortDescription.trim()) errors.shortDescription = "Kratak opis je obavezan.";
    if (!values.description.trim()) errors.description = "Opis je obavezan.";
    if (!values.category) errors.category = "Izaberite kategoriju.";
    if (!values.imageUrl.trim()) errors.imageUrl = "Putanja do slike je obavezna.";

    const price = Number(values.price);
    if (values.price === "" || Number.isNaN(price) || price < 0)
      errors.price = "Cijena mora biti broj 0 ili veći.";

    if (values.compareAtPrice !== "") {
      const compare = Number(values.compareAtPrice);
      if (Number.isNaN(compare) || compare < 0)
        errors.compareAtPrice = "Prethodna cijena mora biti broj 0 ili veći.";
      else if (compare < price)
        errors.compareAtPrice = "Prethodna cijena ne može biti manja od cijene.";
    }

    const stock = Number(values.stock);
    if (values.stock === "" || !Number.isInteger(stock) || stock < 0)
      errors.stock = "Stanje mora biti cijeli broj 0 ili veći.";

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (inFlightRef.current) return;

    setFormError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      document.getElementById(Object.keys(errors)[0])?.focus();
      return;
    }

    // Numbers go out as numbers; tags as a real array.
    const payload = {
      name: values.name.trim(),
      sku: values.sku.trim(),
      shortDescription: values.shortDescription.trim(),
      description: values.description.trim(),
      category: values.category,
      price: Number(values.price),
      stock: Number(values.stock),
      imageUrl: values.imageUrl.trim(),
      featured: values.featured,
      active: values.active,
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    };
    if (values.compareAtPrice !== "") payload.compareAtPrice = Number(values.compareAtPrice);

    inFlightRef.current = true;
    setIsSubmitting(true);
    try {
      const saved = isEdit ? await updateProduct(id, payload) : await createProduct(payload);
      navigate("/admin/products", {
        replace: true,
        state: { savedProduct: saved.name, mode: isEdit ? "edit" : "create" },
      });
    } catch (requestError) {
      const details = requestError.details ?? [];
      if (details.length > 0) {
        setFieldErrors(
          Object.fromEntries(details.map((detail) => [detail.field, detail.message])),
        );
      }
      if (requestError.code === "CONFLICT") {
        // The API reports which unique field collided.
        const conflicted = details.map((d) => d.field);
        setFieldErrors((previous) => ({
          ...previous,
          ...Object.fromEntries(
            conflicted.map((field) => [
              field,
              field === "sku"
                ? "Proizvod sa ovom šifrom već postoji."
                : "Vrijednost već postoji i mora biti jedinstvena.",
            ]),
          ),
        }));
      }
      setFormError(requestError.message);
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isEdit && existing.isLoading) {
    return (
      <section className="section">
        <Container>
          <LoadingState label="Učitavanje proizvoda..." />
        </Container>
      </section>
    );
  }

  if (isEdit && !existing.isLoading && !product) {
    return (
      <section className="section">
        <Container>
          <ErrorState
            headingLevel={1}
            title="Proizvod nije pronađen"
            message="Traženi proizvod ne postoji ili je obrisan."
          />
          <p className="admin__back">
            <Link className="btn btn--secondary" to="/admin/products">
              Nazad na proizvode
            </Link>
          </p>
        </Container>
      </section>
    );
  }

  return (
    <section className="section" aria-labelledby="forma-naslov">
      <Container className="admin-form-page">
        <div className="admin__intro">
          <p className="eyebrow">Administracija</p>
          <h1 id="forma-naslov">{isEdit ? "Izmjena proizvoda" : "Novi proizvod"}</h1>
          <p className="lead">
            {isEdit
              ? "Izmijenite podatke i sačuvajte. Postojeće narudžbe zadržavaju svoje podatke."
              : "Slug se generiše iz naziva na serveru."}
          </p>
        </div>

        <form className="admin-form panel" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <p className="admin-form__error" role="alert" tabIndex={-1} ref={errorRef}>
              {formError}
            </p>
          ) : null}

          <FormField id="name" label="Naziv" error={fieldErrors.name}>
            <input className="form-field__control" id="name" name="name" type="text" maxLength={160}
              required value={values.name} onChange={handleChange}
              aria-invalid={fieldErrors.name ? "true" : undefined}
              aria-describedby={describedBy("name", { hasError: !!fieldErrors.name })} />
          </FormField>

          <FormField id="sku" label="Šifra artikla (SKU)" error={fieldErrors.sku}>
            <input className="form-field__control" id="sku" name="sku" type="text" maxLength={60}
              required value={values.sku} onChange={handleChange}
              aria-invalid={fieldErrors.sku ? "true" : undefined}
              aria-describedby={describedBy("sku", { hasError: !!fieldErrors.sku })} />
          </FormField>

          <FormField id="category" label="Kategorija" error={fieldErrors.category}>
            <select className="form-field__control" id="category" name="category" required
              value={values.category} onChange={handleChange}
              disabled={categories.isLoading || Boolean(categories.error)}
              aria-invalid={fieldErrors.category ? "true" : undefined}
              aria-describedby={describedBy("category", { hasError: !!fieldErrors.category })}>
              <option value="">Izaberite kategoriju</option>
              {(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="shortDescription" label="Kratak opis" error={fieldErrors.shortDescription}>
            <input className="form-field__control" id="shortDescription" name="shortDescription"
              type="text" maxLength={300} required value={values.shortDescription} onChange={handleChange}
              aria-invalid={fieldErrors.shortDescription ? "true" : undefined}
              aria-describedby={describedBy("shortDescription", { hasError: !!fieldErrors.shortDescription })} />
          </FormField>

          <FormField id="description" label="Opis" error={fieldErrors.description}>
            <textarea className="form-field__control form-field__control--textarea" id="description"
              name="description" rows={5} maxLength={5000} required value={values.description}
              onChange={handleChange}
              aria-invalid={fieldErrors.description ? "true" : undefined}
              aria-describedby={describedBy("description", { hasError: !!fieldErrors.description })} />
          </FormField>

          <div className="admin-form__row">
            <FormField id="price" label="Cijena (KM)" error={fieldErrors.price}>
              <input className="form-field__control" id="price" name="price" type="number"
                min="0" step="0.01" required value={values.price} onChange={handleChange}
                aria-invalid={fieldErrors.price ? "true" : undefined}
                aria-describedby={describedBy("price", { hasError: !!fieldErrors.price })} />
            </FormField>

            <FormField id="compareAtPrice" label="Prethodna cijena (opcionalno)"
              help="Mora biti veća ili jednaka cijeni." error={fieldErrors.compareAtPrice}>
              <input className="form-field__control" id="compareAtPrice" name="compareAtPrice"
                type="number" min="0" step="0.01" value={values.compareAtPrice} onChange={handleChange}
                aria-invalid={fieldErrors.compareAtPrice ? "true" : undefined}
                aria-describedby={describedBy("compareAtPrice", { hasHelp: true, hasError: !!fieldErrors.compareAtPrice })} />
            </FormField>

            <FormField id="stock" label="Stanje zaliha" error={fieldErrors.stock}>
              <input className="form-field__control" id="stock" name="stock" type="number"
                min="0" step="1" required value={values.stock} onChange={handleChange}
                aria-invalid={fieldErrors.stock ? "true" : undefined}
                aria-describedby={describedBy("stock", { hasError: !!fieldErrors.stock })} />
            </FormField>
          </div>

          <FormField id="imageUrl" label="Putanja do slike" help="URL ili putanja, npr. /images/product-placeholder.svg"
            error={fieldErrors.imageUrl}>
            <input className="form-field__control" id="imageUrl" name="imageUrl" type="text" required
              value={values.imageUrl} onChange={handleChange}
              aria-invalid={fieldErrors.imageUrl ? "true" : undefined}
              aria-describedby={describedBy("imageUrl", { hasHelp: true, hasError: !!fieldErrors.imageUrl })} />
          </FormField>

          <FormField id="tags" label="Oznake" help="Odvojite zarezom." error={fieldErrors.tags}>
            <input className="form-field__control" id="tags" name="tags" type="text"
              value={values.tags} onChange={handleChange}
              aria-describedby={describedBy("tags", { hasHelp: true, hasError: !!fieldErrors.tags })} />
          </FormField>

          <fieldset className="admin-form__flags">
            <legend className="admin-form__legend">Vidljivost</legend>
            <label className="admin-form__checkbox">
              <input type="checkbox" name="active" checked={values.active} onChange={handleChange} />
              <span>Aktivan (vidljiv na prodavnici)</span>
            </label>
            <label className="admin-form__checkbox">
              <input type="checkbox" name="featured" checked={values.featured} onChange={handleChange} />
              <span>Izdvojen na početnoj strani</span>
            </label>
          </fieldset>

          <div className="admin-form__actions">
            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
              {isSubmitting ? "Snimanje..." : isEdit ? "Sačuvaj izmjene" : "Kreiraj proizvod"}
            </button>
            <Link className="btn btn--secondary" to="/admin/products">
              Odustani
            </Link>
          </div>
        </form>
      </Container>
    </section>
  );
}

export default AdminProductFormPage;
