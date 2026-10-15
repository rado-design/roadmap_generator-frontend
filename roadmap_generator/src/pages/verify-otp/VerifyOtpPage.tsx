import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { Icon } from "../../shared/components/Icon";
import { useAuthStore } from "../../shared/lib/authStore";
import {
  AuthLayout,
  AuthBrandHeader,
  AuthCard,
  OtpShieldBadge,
  OtpForm,
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
    <AuthLayout>
      <AuthBrandHeader />

      <AuthCard>
        {isSuccess ? (
          <div className={styles.successMessage} role="status">
            <Icon
              name="check_circle"
              style={{
                fontSize: 48,
                color: "var(--color-secondary)",
                marginBottom: 12,
              }}
            />
            <h2 className={styles.successTitle}>Compte activé avec succès !</h2>
            <p>Redirection vers votre espace personnel...</p>
          </div>
        ) : (
          <>
            <OtpShieldBadge email={email} />
            <OtpForm email={email} onSuccess={handleVerifySuccess} />
          </>
        )}
      </AuthCard>

      <p className={styles.footerLink}>
        Vous avez déjà activé votre compte ?{" "}
        <Link to="/login">Se connecter</Link>
      </p>
    </AuthLayout>
  );
}
