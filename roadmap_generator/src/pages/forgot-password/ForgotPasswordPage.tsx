import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { AuthLayout, AuthBrandHeader, AuthCard } from "../../features/auth";
import { Input } from "../../shared/components/Input";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import styles from "./ForgotPasswordPage.module.scss";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <AuthLayout>
      <AuthBrandHeader />

      <AuthCard>
        {submitted ? (
          <div className={styles.success} role="status">
            <Icon
              name="mark_email_read"
              style={{ fontSize: 44, color: "var(--color-primary)", marginBottom: 8 }}
            />
            <h2 className={styles.title}>Vérifiez votre boîte mail</h2>
            <p className={styles.text}>
              Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vous a été envoyé.
            </p>
            <Link to="/login" className={styles.backLink}>
              <Button variant="outline" type="button" icon="arrow_back">
                Retour à la connexion
              </Button>
            </Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.intro}>
              <h2 className={styles.title}>Mot de passe oublié</h2>
              <p className={styles.text}>
                Saisissez votre adresse e-mail pour recevoir les instructions de réinitialisation.
              </p>
            </div>

            <Input
              label="Adresse e-mail"
              icon="mail"
              type="email"
              placeholder="jean@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" icon="arrow_forward">
              Envoyer les instructions
            </Button>
          </form>
        )}
      </AuthCard>

      <p className={styles.footerLink}>
        <Link to="/login">Retour à la connexion</Link>
      </p>
    </AuthLayout>
  );
}
