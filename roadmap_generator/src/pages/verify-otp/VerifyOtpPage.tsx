import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { Icon } from "../../shared/components/Icon";
import { Footer } from "../../shared/components/Footer";
import { useAuthStore } from "../../shared/lib/authStore";
import {
  AuthBrandHeader,
  SecurityTrustBanner,
  OtpShieldBadge,
  OtpForm,
  SecurityTrustFootnote,
  SecuritySupportLink,
} from "../../features/auth";
import styles from "./VerifyOtpPage.module.scss";


export function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  // Email transmis depuis la page d'inscription ou paramètre d'URL
  const stateEmail = (location.state as { email?: string })?.email;
  const searchParams = new URLSearchParams(location.search);
  const queryEmail = searchParams.get("email");

  const email = stateEmail || queryEmail || "th****@example.com";

  const [isSuccess, setIsSuccess] = useState(false);

  const handleVerifySuccess = (tokenData: { access_token: string }) => {
    setAccessToken(tokenData.access_token);
    setIsSuccess(true);
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.contentContainer}>
        <div className={styles.innerContainer}>
          {/* Halos lumineux décoratifs d'arrière-plan */}
          <div className={styles.ambientOrb1} aria-hidden="true" />
          <div className={styles.ambientOrb2} aria-hidden="true" />

          {/* En-tête de marque réutilisable AuthBrandHeader */}
          <AuthBrandHeader />


          {/* Bannière méta de sécurité / protocole */}
          <SecurityTrustBanner />

          {/* Carte principale en verre dépoli */}
          <div className={styles.cardContainer}>
            <div className={styles.topAccentBar} />

            <div className={styles.cardBody}>
              {isSuccess ? (
                <div className={styles.successMessage}>
                  <Icon name="check_circle" style={{ fontSize: 48, color: "var(--color-secondary)", marginBottom: 12 }} />
                  <h2 className={styles.successTitle}>Compte activé avec succès !</h2>
                  <p>Redirection vers votre espace personnel...</p>
                </div>
              ) : (
                <>
                  <OtpShieldBadge email={email} />
                  <OtpForm email={email} onSuccess={handleVerifySuccess} />
                </>
              )}
            </div>

            <SecurityTrustFootnote />
          </div>

          {/* Lien d'assistance contextuel sous la carte */}
          <SecuritySupportLink />
        </div>
      </main>

      {/* Pied de page réutilisable */}
      <Footer />
    </div>
  );
}
