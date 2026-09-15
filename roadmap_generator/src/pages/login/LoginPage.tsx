import { Link, useNavigate } from "react-router";
import {
  AuthLayout,
  AuthBrandHeader,
  AuthCard,
  SocialAuthButtons,
} from "../../features/auth";
import { LoginForm } from "../../features/auth/components/LoginForm/LoginForm";
import styles from "./LoginPage.module.scss";


export function LoginPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/");
  };

  return (
    <AuthLayout>
      <AuthBrandHeader />

      <AuthCard>
        <div className={styles.intro}>
          <h2 className={styles.introTitle}>Bon retour</h2>
          <p className={styles.introText}>
            Connectez-vous pour continuer à planifier vos projets.
          </p>
        </div>

        <LoginForm onSuccess={handleSuccess} />

        <div className={styles.divider}>
          <span>Ou se connecter avec</span>
        </div>

        <SocialAuthButtons />
      </AuthCard>

      <p className={styles.footerLink}>
        Vous n'avez pas de compte ? <Link to="/register">Créer un compte</Link>
      </p>
    </AuthLayout>
  );
}
