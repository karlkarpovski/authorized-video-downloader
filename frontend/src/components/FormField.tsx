import type { ReactNode } from "react";
import "./FormField.css";

interface FormFieldProps {
  number: string;
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ number, label, htmlFor, hint, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <div className="form-field__heading">
        <span className="form-field__number" aria-hidden="true">
          FIELD {number}
        </span>
        <label className="form-field__label" htmlFor={htmlFor}>
          {label}
        </label>
      </div>
      {hint && <p className="form-field__hint">{hint}</p>}
      {children}
    </div>
  );
}