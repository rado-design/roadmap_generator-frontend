import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { Icon } from "../Icon";
import styles from "./Input.module.scss";


export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Nom d'icône Material Symbols affichée à gauche du champ */
  icon?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, helperText, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy = error
      ? `${inputId}-error`
      : helperText
        ? `${inputId}-helper`
        : undefined;

    return (
      <div className={styles.field}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        <div className={styles.inputWrapper}>
          {icon && <Icon name={icon} className={styles.icon} />}
          <input
            ref={ref}
            id={inputId}
            className={[
              styles.input,
              icon ? styles.hasIcon : "",
              error ? styles.hasError : "",
              className ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            {...props}
          />
        </div>
        {error ? (
          <p id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
