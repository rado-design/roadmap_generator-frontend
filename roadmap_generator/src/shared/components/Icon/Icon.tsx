import type { CSSProperties } from "react";

interface IconProps {
  /** Nom de l'icône Material Symbols (ex. "mail", "lock", "person") */
  name: string;
  /** Version "remplie" de l'icône (FILL 1) */
  filled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, filled = false, className, style }: IconProps) {
  const mergedStyle = filled
    ? { fontVariationSettings: "'FILL' 1", ...style }
    : style;

  return (
    <span
      className={`material-symbols-outlined${className ? ` ${className}` : ""}`}
      style={mergedStyle}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

