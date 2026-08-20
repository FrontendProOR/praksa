/**
 * Button for real actions (retry, submit). Navigation uses `Link` with the
 * same `.btn` classes, so buttons and links stay visually consistent without
 * turning links into buttons.
 */
function Button({ variant = "primary", type = "button", className = "", children, ...rest }) {
  return (
    <button type={type} className={`btn btn--${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

export default Button;
