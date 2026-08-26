import { useEffect, useRef } from "react";
import "../styles/admin.css";

/**
 * Confirmation for a destructive action.
 *
 * Built on the native `<dialog>` element, so the browser supplies the modal
 * semantics, the focus trap and Escape-to-close rather than a hand-rolled
 * imitation. Focus moves to the cancel button on open - the safe choice, so a
 * stray Enter does not delete anything - and returns to whatever opened the
 * dialog when it closes.
 *
 * The message names the item being deleted; "Are you sure?" on its own tells
 * an administrator nothing.
 */
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Obriši",
  cancelLabel = "Odustani",
  isBusy = false,
  error = null,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && !dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      openerRef.current?.focus?.();
    }

    return undefined;
  }, [open]);

  // Escape closes the dialog itself; keep the caller's state in step.
  const handleCancel = (event) => {
    event.preventDefault();
    if (!isBusy) onCancel();
  };

  return (
    <dialog className="confirm-dialog" ref={dialogRef} onCancel={handleCancel}>
      <h2 className="confirm-dialog__title">{title}</h2>
      <p className="confirm-dialog__message">{message}</p>

      {error ? (
        <p className="confirm-dialog__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="confirm-dialog__actions">
        <button
          type="button"
          className="btn btn--secondary"
          ref={cancelRef}
          onClick={onCancel}
          disabled={isBusy}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="btn btn--danger"
          onClick={onConfirm}
          disabled={isBusy}
        >
          {isBusy ? "Brisanje..." : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
