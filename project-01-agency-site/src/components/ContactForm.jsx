import { useEffect, useRef, useState } from "react";
import { CONTACT_FORM, CONTACT_FORM_LIMITS as LIMITS } from "../data/site.js";
import "../styles/contact-form.css";

const FIELD_ORDER = ["name", "email", "projectType", "message"];

const EMPTY_VALUES = { name: "", email: "", projectType: "", message: "" };

/**
 * Pragmatic email check: one @, something before it, and a dotted domain
 * after it. Deliberately not an RFC-complete pattern.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Simulated request duration for the demo submission. */
const SUBMIT_DELAY_MS = 700;

/** Returns an error message for one field, or an empty string when valid. */
function validateField(field, rawValue) {
  const value = rawValue.trim();
  const { errors } = CONTACT_FORM;

  switch (field) {
    case "name":
      if (!value) return errors.nameRequired;
      if (value.length < LIMITS.nameMin) return errors.nameShort;
      if (value.length > LIMITS.nameMax) return errors.nameLong;
      return "";
    case "email":
      if (!value) return errors.emailRequired;
      if (value.length > LIMITS.emailMax) return errors.emailLong;
      if (!EMAIL_PATTERN.test(value)) return errors.emailInvalid;
      return "";
    case "projectType":
      if (!CONTACT_FORM.projectTypes.includes(value))
        return errors.projectTypeRequired;
      return "";
    case "message":
      if (!value) return errors.messageRequired;
      if (value.length < LIMITS.messageMin) return errors.messageShort;
      if (value.length > LIMITS.messageMax) return errors.messageLong;
      return "";
    default:
      return "";
  }
}

function validateAll(values) {
  return FIELD_ORDER.reduce((collected, field) => {
    const error = validateField(field, values[field]);
    if (error) collected[field] = error;
    return collected;
  }, {});
}

/** Builds the aria-describedby value for a control. */
function describedBy(id, { hasHelp, hasError }) {
  const ids = [];
  if (hasHelp) ids.push(`${id}-help`);
  if (hasError) ids.push(`${id}-error`);
  return ids.length ? ids.join(" ") : undefined;
}

/** Label + control + help text + error message, shared by all four fields. */
function Field({ id, label, help, error, children }) {
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      {help ? (
        <p className="form-field__help" id={`${id}-help`}>
          {help}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className="form-field__error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Contact form with client-side validation only.
 *
 * There is no backend in this project: a valid submission runs a short
 * simulated delay and then shows a success state that says explicitly that
 * nothing was sent or stored.
 */
function ContactForm() {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const timerRef = useRef(null);
  const successRef = useRef(null);
  const firstFieldRef = useRef(null);

  const isSubmitting = status === "submitting";

  // Do not leave a pending timer behind if the section unmounts mid-submit.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Move focus to the confirmation so it is announced and reachable.
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));

    // Once a field has been flagged, re-check it as the user fixes it.
    if (errors[name]) {
      const error = validateField(name, value);
      setErrors((previous) => {
        const next = { ...previous };
        if (error) next[name] = error;
        else delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const error = validateField(name, value);
    setErrors((previous) => {
      const next = { ...previous };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validateAll(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      // Send focus to the first field that needs attention.
      const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setStatus("submitting");
    timerRef.current = setTimeout(() => {
      setStatus("success");
      setValues(EMPTY_VALUES);
      setErrors({});
    }, SUBMIT_DELAY_MS);
  };

  const handleReset = () => {
    setStatus("idle");
    // Return the user to the top of the form, ready to type again.
    window.requestAnimationFrame(() => firstFieldRef.current?.focus());
  };

  if (status === "success") {
    return (
      <div
        className="card contact-form contact-form--success"
        ref={successRef}
        role="status"
        tabIndex={-1}
      >
        <span className="contact-form__success-mark" aria-hidden="true" />
        <h3 className="contact-form__title">{CONTACT_FORM.success.title}</h3>
        <p className="card__text">{CONTACT_FORM.success.text}</p>
        <button type="button" className="btn btn--secondary" onClick={handleReset}>
          {CONTACT_FORM.success.again}
        </button>
      </div>
    );
  }

  return (
    /*
      noValidate turns off native validation bubbles so the custom messages are
      the single source of feedback; the `required` attributes stay for
      semantics and assistive technology.
    */
    <form
      className="card contact-form"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSubmitting}
      aria-labelledby="kontakt-forma-naslov"
    >
      <h3 className="contact-form__title" id="kontakt-forma-naslov">
        {CONTACT_FORM.title}
      </h3>
      <p className="contact-form__note">{CONTACT_FORM.demoNote}</p>

      <Field id="name" label={CONTACT_FORM.labels.name} error={errors.name}>
        <input
          className="form-field__control"
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={LIMITS.nameMax}
          required
          ref={firstFieldRef}
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={describedBy("name", { hasError: !!errors.name })}
        />
      </Field>

      <Field
        id="email"
        label={CONTACT_FORM.labels.email}
        help={CONTACT_FORM.help.email}
        error={errors.email}
      >
        <input
          className="form-field__control"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={LIMITS.emailMax}
          required
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={describedBy("email", {
            hasHelp: true,
            hasError: !!errors.email,
          })}
        />
      </Field>

      <Field
        id="projectType"
        label={CONTACT_FORM.labels.projectType}
        error={errors.projectType}
      >
        <select
          className="form-field__control"
          id="projectType"
          name="projectType"
          required
          value={values.projectType}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={errors.projectType ? "true" : undefined}
          aria-describedby={describedBy("projectType", {
            hasError: !!errors.projectType,
          })}
        >
          <option value="">{CONTACT_FORM.projectTypePlaceholder}</option>
          {CONTACT_FORM.projectTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="message"
        label={CONTACT_FORM.labels.message}
        help={CONTACT_FORM.help.message}
        error={errors.message}
      >
        <textarea
          className="form-field__control form-field__control--textarea"
          id="message"
          name="message"
          rows={5}
          maxLength={LIMITS.messageMax}
          required
          value={values.message}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={errors.message ? "true" : undefined}
          aria-describedby={describedBy("message", {
            hasHelp: true,
            hasError: !!errors.message,
          })}
        />
        <p className="form-field__counter" aria-hidden="true">
          {values.message.length}/{LIMITS.messageMax}
        </p>
      </Field>

      <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
        {isSubmitting ? CONTACT_FORM.submittingLabel : CONTACT_FORM.submitLabel}
      </button>
    </form>
  );
}

export default ContactForm;
