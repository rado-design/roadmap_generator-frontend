import { useState, useEffect, useCallback } from "react";
import { Icon } from "../../../../shared/components/Icon";
import styles from "./OtpCountdownTimer.module.scss";


interface OtpCountdownTimerProps {
  initialSeconds?: number;
  onResend?: () => void;
  isResending?: boolean;
}

export function OtpCountdownTimer({
  initialSeconds = 105,
  onResend,
  isResending = false,
}: OtpCountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const handleResend = useCallback(() => {
    setSeconds(120);
    setResendSent(true);
    if (onResend) onResend();

    setTimeout(() => {
      setResendSent(false);
    }, 2500);
  }, [onResend]);

  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const formattedSeconds = remSeconds < 10 ? `0${remSeconds}` : `${remSeconds}`;
  const isExpired = seconds <= 0;
  const percent = isExpired ? 0 : (seconds / initialSeconds) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <div className={styles.labelGroup}>
          <Icon name="timer" className={styles.timerIcon} />
          <span>Validité du code</span>
        </div>
        <span className={isExpired ? styles.expiredText : styles.timeText}>
          {isExpired ? "Expiré" : `${formattedMinutes}:${formattedSeconds}`}
        </span>
      </div>

      <div className={styles.track}>
        <div
          className={`${styles.bar} ${isExpired ? styles.barExpired : ""}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className={styles.bottomRow}>
        <span className={styles.question}>Vous n’avez rien reçu ?</span>
        <button
          type="button"
          className={styles.resendBtn}
          onClick={handleResend}
          disabled={isResending}
        >
          {resendSent || isResending ? (
            <>
              <Icon name="refresh" className={styles.spinIcon} />
              <span>Code renvoyé !</span>
            </>
          ) : (
            <>
              <Icon name="refresh" />
              <span>Renvoyer un nouveau code</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
