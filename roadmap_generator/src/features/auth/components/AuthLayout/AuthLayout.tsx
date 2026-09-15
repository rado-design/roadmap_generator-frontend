import type { ReactNode } from "react";
import styles from "./AuthLayout.module.css";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Mise en page partagée par les pages d'authentification (inscription,
 * connexion, vérification OTP...) : fond mesh + carte centrée.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <main className={styles.container}>{children}</main>
      <div className={styles.blobPrimary} aria-hidden="true" />
      <div className={styles.blobSecondary} aria-hidden="true" />
    </div>
  );
}
