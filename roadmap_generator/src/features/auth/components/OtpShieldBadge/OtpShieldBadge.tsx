import { Icon } from "../../../../shared/components/Icon";
import styles from "./OtpShieldBadge.module.scss";


interface OtpShieldBadgeProps {
  email?: string;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [name, domain] = email.split("@");
  if (name.length <= 2) return `${name}****@${domain}`;
  return `${name.slice(0, 2)}****@${domain}`;
}

export function OtpShieldBadge({ email = "th****@example.com" }: OtpShieldBadgeProps) {
  const displayEmail = email.includes("****") ? email : maskEmail(email);

  return (
    <div className={styles.header}>
      <div className={styles.iconWrapper}>
        <div className={styles.halo} aria-hidden="true" />
        <div className={styles.mainBadge}>
          <Icon name="verified_user" filled className={styles.mainIcon} />
        </div>
        <div className={styles.subBadge}>
          <Icon name="key" className={styles.subIcon} />
        </div>
      </div>

      <h1 className={styles.title}>Vérification de sécurité</h1>

      <p className={styles.description}>
        Saisissez le code à 6 chiffres envoyé à l’adresse{" "}
        <span className={styles.emailHighlight}>{displayEmail}</span> ou généré par
        votre application d’authentification.
      </p>
    </div>
  );
}
