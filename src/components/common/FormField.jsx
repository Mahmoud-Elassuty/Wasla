import { useT } from "../../i18n/useT";
// Works for <input> (default), <select> and <textarea>: <FormField as="select">...options...</FormField>
export default function FormField({ id, label, error, as: Control = "input", children, ...props }) {
  const { t } = useT();
  const base = Control === "select" ? "form-select" : "form-control";
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label small fw-semibold">
        {typeof label === "string" ? t(label) : label}
      </label>
      <Control
        id={id}
        name={id}
        className={`${base} py-2${error ? " is-invalid" : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
        placeholder={typeof props.placeholder === "string" ? t(props.placeholder) : props.placeholder}
      >
        {children}
      </Control>
      {error && (
        <div id={`${id}-error`} className="invalid-feedback">
          {typeof error === "string" ? t(error) : error}
        </div>
      )}
    </div>
  );
}
