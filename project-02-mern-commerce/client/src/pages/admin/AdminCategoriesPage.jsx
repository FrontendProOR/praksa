import { useRef, useState } from "react";
import Container from "../../components/Container.jsx";
import FormField from "../../components/FormField.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews.jsx";
import { describedBy } from "../../utils/aria.js";
import { useApiResource } from "../../hooks/useApiResource.js";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../../api/categories.js";
import "../../styles/admin.css";

/**
 * Category management: list, create, edit and delete on one screen.
 *
 * Deleting a category that active products still use is refused by the API
 * with 409, and that refusal is shown as it is - the products are never
 * reassigned or deleted behind the administrator's back.
 *
 * There is deliberately no "active" switch here. The category listing endpoint
 * is the public one and returns active categories only, so deactivating a
 * category from this screen would make it disappear from the very list needed
 * to bring it back. Categories are created active; the status column still
 * reports what the record says.
 */
const EMPTY = { name: "", description: "" };

function AdminCategoriesPage() {
  const { data: categories, error, isLoading, reload } = useApiResource(
    ({ signal }) => fetchCategories({ signal }),
    [],
  );

  const [values, setValues] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const inFlightRef = useRef(false);
  const formErrorRef = useRef(null);
  const nameRef = useRef(null);

  const startEdit = (category) => {
    setEditingId(category.id);
    setValues({ name: category.name, description: category.description ?? "" });
    setFieldErrors({});
    setFormError(null);
    nameRef.current?.focus();
  };

  const resetForm = () => {
    setEditingId(null);
    setValues(EMPTY);
    setFieldErrors({});
    setFormError(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((previous) => {
        const next = { ...previous };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (inFlightRef.current) return;

    setFormError(null);
    if (!values.name.trim()) {
      setFieldErrors({ name: "Naziv kategorije je obavezan." });
      nameRef.current?.focus();
      return;
    }

    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
    };

    inFlightRef.current = true;
    setIsSubmitting(true);
    try {
      const saved = editingId
        ? await updateCategory(editingId, payload)
        : await createCategory(payload);
      setNotice(
        editingId ? `Kategorija "${saved.name}" je izmijenjena.` : `Kategorija "${saved.name}" je dodana.`,
      );
      resetForm();
      reload();
    } catch (requestError) {
      const details = requestError.details ?? [];
      if (details.length > 0) {
        setFieldErrors(Object.fromEntries(details.map((d) => [d.field, d.message])));
      }
      if (requestError.code === "CONFLICT") {
        setFieldErrors((previous) => ({
          ...previous,
          name: "Kategorija sa ovim nazivom već postoji.",
        }));
      }
      setFormError(requestError.message);
      formErrorRef.current?.focus();
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteCategory(pendingDelete.id);
      setNotice(`Kategorija "${pendingDelete.name}" je obrisana.`);
      setPendingDelete(null);
      reload();
    } catch (requestError) {
      // 409 while products still reference it: show the server's explanation.
      setDeleteError(
        requestError.code === "CONFLICT"
          ? `${requestError.message} Prebacite te proizvode u drugu kategoriju ili ih deaktivirajte, pa pokušajte ponovo.`
          : requestError.message,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="section" aria-labelledby="kategorije-naslov">
      <Container>
        <div className="admin__intro">
          <p className="eyebrow">Administracija</p>
          <h1 id="kategorije-naslov">Kategorije</h1>
          <p className="lead">Grupe proizvoda u katalogu.</p>
        </div>

        {notice ? (
          <p className="admin__notice" role="status">
            {notice}
          </p>
        ) : null}

        <div className="admin-split">
          <div>
            {isLoading ? <LoadingState label="Učitavanje kategorija..." /> : null}

            {error ? (
              <ErrorState title="Kategorije nisu učitane" message={error.message} onRetry={reload} />
            ) : null}

            {!isLoading && !error ? (
              categories.length === 0 ? (
                <EmptyState title="Nema kategorija" message="Dodajte prvu kategoriju." />
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <caption className="visually-hidden">Kategorije u katalogu</caption>
                    <thead>
                      <tr>
                        <th scope="col">Naziv</th>
                        <th scope="col">Slug</th>
                        <th scope="col">Status</th>
                        <th scope="col">Akcije</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id}>
                          <th scope="row" className="admin-table__name">
                            {category.name}
                          </th>
                          <td>{category.slug}</td>
                          <td>
                            <span className={`state-pill state-pill--${category.active ? "on" : "off"}`}>
                              {category.active ? "Aktivna" : "Neaktivna"}
                            </span>
                          </td>
                          <td className="admin-table__actions">
                            <button type="button" className="btn btn--secondary btn--sm"
                              onClick={() => startEdit(category)}>
                              Izmijeni
                              <span className="visually-hidden"> kategoriju {category.name}</span>
                            </button>
                            <button type="button" className="btn btn--ghost btn--sm"
                              onClick={() => {
                                setDeleteError(null);
                                setPendingDelete(category);
                              }}>
                              Obriši
                              <span className="visually-hidden"> kategoriju {category.name}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : null}
          </div>

          <form className="admin-form panel" onSubmit={handleSubmit} noValidate
            aria-labelledby="forma-kategorije-naslov">
            <h2 id="forma-kategorije-naslov" className="admin__block-title">
              {editingId ? "Izmjena kategorije" : "Nova kategorija"}
            </h2>

            {formError ? (
              <p className="admin-form__error" role="alert" tabIndex={-1} ref={formErrorRef}>
                {formError}
              </p>
            ) : null}

            <FormField id="category-name" label="Naziv" error={fieldErrors.name}>
              <input className="form-field__control" id="category-name" name="name" type="text"
                maxLength={120} required ref={nameRef} value={values.name} onChange={handleChange}
                aria-invalid={fieldErrors.name ? "true" : undefined}
                aria-describedby={describedBy("category-name", { hasError: !!fieldErrors.name })} />
            </FormField>

            <FormField id="category-description" label="Opis (opcionalno)" error={fieldErrors.description}>
              <textarea className="form-field__control form-field__control--textarea"
                id="category-description" name="description" rows={3} maxLength={500}
                value={values.description} onChange={handleChange}
                aria-invalid={fieldErrors.description ? "true" : undefined}
                aria-describedby={describedBy("category-description", { hasError: !!fieldErrors.description })} />
            </FormField>

            <div className="admin-form__actions">
              <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                {isSubmitting ? "Snimanje..." : editingId ? "Sačuvaj izmjene" : "Dodaj kategoriju"}
              </button>
              {editingId ? (
                <button type="button" className="btn btn--secondary" onClick={resetForm}>
                  Odustani
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <ConfirmDialog
          open={Boolean(pendingDelete)}
          title="Brisanje kategorije"
          message={pendingDelete ? `Kategorija "${pendingDelete.name}" biće obrisana.` : ""}
          isBusy={isDeleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => {
            if (!isDeleting) {
              setPendingDelete(null);
              setDeleteError(null);
            }
          }}
        />
      </Container>
    </section>
  );
}

export default AdminCategoriesPage;
