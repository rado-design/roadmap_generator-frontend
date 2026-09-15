import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./Checkbox.module.css";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={styles.field}>
        <div className={styles.row}>
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            className={[styles.checkbox, className ?? ""].filter(Boolean).join(" ")}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        </div>
        {error && (
          <p id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
