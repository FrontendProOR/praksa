import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Container from "../components/Container.jsx";
import FormField from "../components/FormField.jsx";
import { describedBy } from "../utils/aria.js";
import { useAuth } from "../context/auth-context.js";
import "../styles/auth.css";

/**
 * Registration page.
 *
 * There is no role control of any kind: the API assigns `user` to every
 * account created here, and ignores a role sent in the body. Admin accounts
 * are created by a server-side script, never through this form.
 *
 * The API starts the session on success, so the new account is signed in
 * immediately.
 */
/**
 * Turns an API failure into a message in the interface language. The API
 * answers in English, which is correct for the contract but not something to
 * show a user reading a Serbian page.
 */
function registerErrorMessage(error) {
  switch (error.code) {
    case "CONFLICT":
      return "Nalog sa ovom email adresom već postoji.";
    case "VALIDATION_ERROR":
      return "Provjerite unesene podatke.";
    case "FORBIDDEN":
      return "Previše pokušaja. Sačekajte nekoliko minuta i pokušajte ponovo.";
    default:
      return error.message;
  }
}

const EMPTY = { name: "", email: "", password: "" };

// Mirrors the server's rule: at least 8 characters, one letter and one digit.
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PASSWORD_RULE =
  "Lozinka mora imati najmanje 8 znakova, uz bar jedno slovo i jedan broj.";

function RegisterPage() {
  const { register, isAuthenticated, authReady } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Guards against a second submit in the same tick: state (and therefore the
  // disabled attribute) only updates on the next render, so rapid clicks would
  // otherwise all get through.
  const inFlightRef = useRef(false);
  const errorRef = useRef(null);

  useEffect(() => {
    if (formError) errorRef.current?.focus();
  }, [formError]);

  if (authReady && isAuthenticated) return <Navigate to="/account" replace />;

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

  const validate = () => {
    const errors = {};
    const name = values.name.trim();
    const email = values.email.trim();

    if (!name) errors.name = "Unesite ime i prezime.";
    else if (name.length < 2) errors.name = "Ime mora imati najmanje 2 znaka.";
    else if (name.length > 80) errors.name = "Ime može imati najviše 80 znakova.";

    if (!email) errors.email = "Unesite email adresu.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      errors.email = "Email adresa nije ispravnog formata.";

    if (!values.password) errors.password = "Unesite lozinku.";
    else if (!PASSWORD_PATTERN.test(values.password)) errors.password = PASSWORD_RULE;

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

    inFlightRef.current = true;
    setIsSubmitting(true);
    try {
      // Only these three fields are ever sent.
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      navigate("/account", { replace: true });
    } catch (error) {
      const details = error.details ?? [];
      if (details.length > 0) {
        setFieldErrors(
          Object.fromEntries(details.map((detail) => [detail.field, detail.message])),
        );
      }
      // A duplicate email comes back as CONFLICT; show it on the field too.
      if (error.code === "CONFLICT") {
        setFieldErrors((previous) => ({
          ...previous,
          email: "Nalog sa ovom email adresom već postoji.",
        }));
      }
      setFormError(registerErrorMessage(error));
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section" aria-labelledby="registracija-naslov">
      <Container className="auth">
        <div className="auth__intro">
          <p className="eyebrow">Nalog</p>
          <h1 id="registracija-naslov">Registracija</h1>
          <p className="lead">
            Otvorite nalog da biste pratili svoje narudžbe i podatke.
          </p>
        </div>

        <form className="auth__form panel" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <p className="auth__error" role="alert" tabIndex={-1} ref={errorRef}>
              {formError}
            </p>
          ) : null}

          <FormField id="name" label="Ime i prezime" error={fieldErrors.name}>
            <input
              className="form-field__control"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={80}
              required
              value={values.name}
              onChange={handleChange}
              aria-invalid={fieldErrors.name ? "true" : undefined}
              aria-describedby={describedBy("name", { hasError: !!fieldErrors.name })}
            />
          </FormField>

          <FormField id="email" label="Email adresa" error={fieldErrors.email}>
            <input
              className="form-field__control"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={120}
              required
              value={values.email}
              onChange={handleChange}
              aria-invalid={fieldErrors.email ? "true" : undefined}
              aria-describedby={describedBy("email", { hasError: !!fieldErrors.email })}
            />
          </FormField>

          <FormField
            id="password"
            label="Lozinka"
            help={PASSWORD_RULE}
            error={fieldErrors.password}
          >
            <input
              className="form-field__control"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={values.password}
              onChange={handleChange}
              aria-invalid={fieldErrors.password ? "true" : undefined}
              aria-describedby={describedBy("password", {
                hasHelp: true,
                hasError: !!fieldErrors.password,
              })}
            />
          </FormField>

          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? "Kreiranje naloga..." : "Kreiraj nalog"}
          </button>

          <p className="auth__switch">
            Već imate nalog? <Link to="/login">Prijavite se</Link>
          </p>
        </form>
      </Container>
    </section>
  );
}

export default RegisterPage;
