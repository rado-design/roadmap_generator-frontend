import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
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
  ({ label, icon, error, helperText, id, className, type, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const isPassword = type === "password";
    const [showPassword, setShowPassword] = useState(false);

    const actualType = isPassword
      ? showPassword
        ? "text"
        : "password"
      : type;

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
            type={actualType}
            className={[
              styles.input,
              icon ? styles.hasIcon : "",
              isPassword ? styles.hasTrailingAction : "",
              error ? styles.hasError : "",
              className ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              tabIndex={-1}
            >
              <Icon name={showPassword ? "visibility_off" : "visibility"} />
            </button>
          )}
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
