import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Container from "../components/Container.jsx";
import FormField from "../components/FormField.jsx";
import { describedBy } from "../utils/aria.js";
import { useAuth } from "../context/auth-context.js";
import "../styles/auth.css";

/**
 * Sign-in page.
 *
 * The API answers a wrong password and an unknown email identically, and the
 * message shown here is equally vague, so the page never reveals which
 * addresses are registered.
 *
 * On success the user is returned to wherever the protected route sent them
 * from, or to the account page.
 */
const EMPTY = { email: "", password: "" };

/**
 * Turns an API failure into a message in the interface language.
 *
 * The API answers in English, which is right for a REST contract but wrong to
 * put in front of a user reading a Serbian page. The wording for a failed sign
 * in stays deliberately vague - the server does not say whether the address is
 * registered, and neither does this.
 */
function loginErrorMessage(error) {
  switch (error.code) {
    case "UNAUTHORIZED":
      return "Pogrešna email adresa ili lozinka.";
    case "VALIDATION_ERROR":
      return "Provjerite unesene podatke.";
    case "FORBIDDEN":
      // The rate limiter answers with FORBIDDEN + HTTP 429.
      return "Previše pokušaja prijave. Sačekajte nekoliko minuta i pokušajte ponovo.";
    default:
      return error.message;
  }
}

function LoginPage() {
  const { login, isAuthenticated, authReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Guards against a second submit in the same tick: state (and therefore the
  // disabled attribute) only updates on the next render, so rapid clicks would
  // otherwise all get through.
  const inFlightRef = useRef(false);
  const errorRef = useRef(null);

  const redirectTo = location.state?.from?.pathname ?? "/account";

  // Move focus to the failure message so it is noticed and announced.
  useEffect(() => {
    if (formError) errorRef.current?.focus();
  }, [formError]);

  // Someone who is already signed in has no business on the login form.
  if (authReady && isAuthenticated) return <Navigate to={redirectTo} replace />;

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
    if (!values.email.trim()) errors.email = "Unesite email adresu.";
    if (!values.password) errors.password = "Unesite lozinku.";
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
      await login({ email: values.email.trim(), password: values.password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      // Per-field details when the API sends them, otherwise the generic message.
      const details = error.details ?? [];
      if (details.length > 0) {
        setFieldErrors(
          Object.fromEntries(details.map((detail) => [detail.field, detail.message])),
        );
      }
      setFormError(loginErrorMessage(error));
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section" aria-labelledby="prijava-naslov">
      <Container className="auth">
        <div className="auth__intro">
          <p className="eyebrow">Nalog</p>
          <h1 id="prijava-naslov">Prijava</h1>
          <p className="lead">Prijavite se da biste pristupili svom nalogu.</p>
        </div>

        <form className="auth__form panel" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <p className="auth__error" role="alert" tabIndex={-1} ref={errorRef}>
              {formError}
            </p>
          ) : null}

          <FormField id="email" label="Email adresa" error={fieldErrors.email}>
            <input
              className="form-field__control"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={handleChange}
              aria-invalid={fieldErrors.email ? "true" : undefined}
              aria-describedby={describedBy("email", { hasError: !!fieldErrors.email })}
            />
          </FormField>

          <FormField id="password" label="Lozinka" error={fieldErrors.password}>
            <input
              className="form-field__control"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={values.password}
              onChange={handleChange}
              aria-invalid={fieldErrors.password ? "true" : undefined}
              aria-describedby={describedBy("password", { hasError: !!fieldErrors.password })}
            />
          </FormField>

          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? "Prijava u toku..." : "Prijavi se"}
          </button>

          <p className="auth__switch">
            Nemate nalog? <Link to="/register">Registrujte se</Link>
          </p>
        </form>
      </Container>
    </section>
  );
}

export default LoginPage;
