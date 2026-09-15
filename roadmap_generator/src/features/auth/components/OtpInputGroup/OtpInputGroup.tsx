import { useRef, type KeyboardEvent, type ClipboardEvent, type ChangeEvent } from "react";
import styles from "./OtpInputGroup.module.scss";


interface OtpInputGroupProps {
  digits: string[];
  onChange: (newDigits: string[]) => void;
  disabled?: boolean;
}

export function OtpInputGroup({ digits, onChange, disabled = false }: OtpInputGroupProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateDigitAtIndex = (index: number, val: string) => {
    const next = [...digits];
    next[index] = val;
    onChange(next);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const clean = rawVal.replace(/[^0-9]/g, "");

    if (!clean) {
      updateDigitAtIndex(index, "");
      return;
    }

    // Single digit entry
    const char = clean.slice(-1);
    updateDigitAtIndex(index, char);

    // Auto-advance
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const clean = pastedText.replace(/[^0-9]/g, "").slice(0, 6);
    if (!clean) return;

    const nextDigits = [...digits];
    clean.split("").forEach((char, i) => {
      if (i < 6) nextDigits[i] = char;
    });
    onChange(nextDigits);

    const focusIdx = Math.min(clean.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className={styles.grid}>
      {Array.from({ length: 6 }).map((_, index) => {
        const value = digits[index] || "";
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            autoFocus={index === 0}
            aria-label={`Chiffre ${index + 1}`}
            data-index={index}
            value={value}
            disabled={disabled}
            placeholder="·"
            className={`${styles.input} ${value ? styles.inputFilled : ""}`}
            onChange={(e) => handleInputChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={() => handleFocus(index)}
            onPaste={handlePaste}
          />
        );
      })}
    </div>
  );
}
