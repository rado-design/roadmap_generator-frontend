import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../Icon";
import styles from "./FilterSelect.module.scss";

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function FilterSelect({ label, value, options, onChange, disabled = false }: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => optionRefs.current[options.findIndex((option) => option.value === value)]?.focus());
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={`${label} : ${selectedOption?.label ?? ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedOption?.label ?? "Choisir"}</span>
        <Icon name={open ? "keyboard_arrow_up" : "keyboard_arrow_down"} />
      </button>
      {open ? (
        <div id={menuId} className={styles.menu} role="listbox" aria-label={label}>
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                ref={(element) => { optionRefs.current[index] = element; }}
                type="button"
                role="option"
                aria-selected={selected}
                className={`${styles.option} ${selected ? styles.selected : ""}`}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    optionRefs.current[(index + 1) % options.length]?.focus();
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    optionRefs.current[(index - 1 + options.length) % options.length]?.focus();
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    optionRefs.current[0]?.focus();
                  } else if (event.key === "End") {
                    event.preventDefault();
                    optionRefs.current[options.length - 1]?.focus();
                  }
                }}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <span className={styles.radio} aria-hidden="true">{selected ? <span /> : null}</span>
                <span className={styles.optionLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
