import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Icon } from "../Icon";
import styles from "./Button.module.scss";


export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  /** Nom d'icône Material Symbols affichée après le texte */
  icon?: string;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      icon,
      isLoading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={[styles.button, styles[variant], className ?? ""]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          <>
            {children}
            {icon && <Icon name={icon} />}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
