import "../styles/form.css";

/**
 * Label + control + help text + error message.
 *
 * The error is linked to the control with `aria-describedby` and the control
 * is marked `aria-invalid`, so the problem is announced rather than only shown
 * in red. Errors are always words, never colour alone.
 */
function FormField({ id, label, error, help, children }) {
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

export default FormField;
