interface IconProps {
  /** Nom de l'icône Material Symbols (ex. "mail", "lock", "person") */
  name: string;
  /** Version "remplie" de l'icône (FILL 1) */
  filled?: boolean;
  className?: string;
}

export function Icon({ name, filled = false, className }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined${className ? ` ${className}` : ""}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
