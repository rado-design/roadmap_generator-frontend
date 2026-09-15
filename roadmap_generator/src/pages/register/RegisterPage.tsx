import { useState } from "react";
import { Link } from "react-router";
import {
  AuthLayout,
  AuthBrandHeader,
  AuthCard,
  RegisterForm,
  SocialAuthButtons,
} from "../../features/auth";
import styles from "./RegisterPage.module.css";

export function RegisterPage() {
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  return (
    <AuthLayout>
      <AuthBrandHeader />

      <AuthCard>
        {registeredEmail ? (
          <div className={styles.success}>
            <h2 className={styles.successTitle}>Vérifiez votre boîte mail</h2>
            <p className={styles.successText}>
              Un code de vérification a été envoyé à{" "}
              <strong>{registeredEmail}</strong>.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.intro}>
              <h2 className={styles.introTitle}>Créer un compte</h2>
              <p className={styles.introText}>
                Commencez à planifier vos projets dès aujourd'hui.
              </p>
            </div>

            <RegisterForm onSuccess={setRegisteredEmail} />

            <div className={styles.divider}>
              <span>Ou s'inscrire avec</span>
            </div>

            <SocialAuthButtons />
          </>
        )}
      </AuthCard>

      <p className={styles.footerLink}>
        Vous avez déjà un compte ? <Link to="/login">Connectez-vous</Link>
      </p>
    </AuthLayout>
  );
}
