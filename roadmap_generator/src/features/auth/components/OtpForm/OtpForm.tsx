import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Icon } from "../../../../shared/components/Icon";
import { Button } from "../../../../shared/components/Button";
import { OtpInputGroup } from "../OtpInputGroup";
import { OtpCountdownTimer } from "../OtpCountdownTimer";
import { useVerifyOtpMutation } from "../../hooks/useVerifyOtpMutation";
import { useResendOtpMutation } from "../../hooks/useResendOtpMutation";
import styles from "./OtpForm.module.scss";


interface OtpFormProps {
  email: string;
  onSuccess?: (tokenData: { access_token: string; refresh_token: string }) => void;
}

export function OtpForm({ email, onSuccess }: OtpFormProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [validationError, setValidationError] = useState<string | null>(null);

  const verifyMutation = useVerifyOtpMutation();
  const resendMutation = useResendOtpMutation();

  const handlePasteCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const clean = text.replace(/[^0-9]/g, "").slice(0, 6);
        if (clean.length > 0) {
          const nextDigits = Array(6).fill("");
          clean.split("").forEach((char, i) => {
            nextDigits[i] = char;
          });
          setDigits(nextDigits);
          setValidationError(null);
        }
      }
    } catch {
      // Ignoré si permission refusée
    }
  };

  const handleResendOtp = () => {
    if (!email) return;
    resendMutation.mutate({ email });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const code = digits.join("");
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setValidationError("Veuillez saisir les 6 chiffres du code OTP.");
      return;
    }

    verifyMutation.mutate(
      { email, otp_code: code },
      {
        onSuccess: (data) => {
          if (onSuccess) onSuccess(data);
        },
      },
    );
  };

  const isPending = verifyMutation.isPending;
  const errorMsg =
    validationError || verifyMutation.error?.message || resendMutation.error?.message;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Action rapide : Coller le code */}
      <div className={styles.pasteRow}>
        <button
          type="button"
          className={styles.pasteBtn}
          onClick={handlePasteCode}
        >
          <Icon name="content_paste" className={styles.pasteIcon} />
          <span>Coller le code</span>
        </button>
      </div>

      {/* Grille 6 chiffres */}
      <OtpInputGroup
        digits={digits}
        onChange={(newDigits) => {
          setDigits(newDigits);
          if (validationError) setValidationError(null);
        }}
        disabled={isPending}
      />

      {/* Temporisateur & Renvoi */}
      <OtpCountdownTimer
        initialSeconds={105}
        onResend={handleResendOtp}
        isResending={resendMutation.isPending}
      />

      {errorMsg && (
        <p className={styles.formError} role="alert">
          {errorMsg}
        </p>
      )}

      {/* Bouton de soumission principal */}
      <Button
        type="submit"
        icon="arrow_forward"
        isLoading={isPending}
        disabled={isPending}
        style={{ width: "100%" }}
      >
        Valider et continuer
      </Button>

      {/* Action retour */}
      <div className={styles.backRow}>
        <div className={styles.backContainer}>
          <Link to="/register" className={styles.backLink}>
            <Icon name="arrow_back" className={styles.backIcon} />
            <span>Retour à la création de compte</span>
          </Link>
        </div>
      </div>
    </form>
  );
}
