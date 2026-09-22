// Works for <input> (default), <select> and <textarea>: <FormField as="select">...options...</FormField>
export default function FormField({ id, label, error, as: Control = "input", children, ...props }) {
  const base = Control === "select" ? "form-select" : "form-control";
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label small fw-semibold">
        {label}
      </label>
      <Control
        id={id}
        name={id}
        className={`${base} py-2${error ? " is-invalid" : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      >
        {children}
      </Control>
      {error && (
        <div id={`${id}-error`} className="invalid-feedback">
          {error}
        </div>
      )}
    </div>
  );
}
