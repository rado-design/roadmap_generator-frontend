import { Link } from "react-router";
import { AuthLayout, AuthBrandHeader, AuthCard } from "../../features/auth";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";

export function NotFoundPage() {
  return (
    <AuthLayout>
      <AuthBrandHeader />

      <AuthCard>
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Icon
            name="explore_off"
            style={{ fontSize: 56, color: "var(--color-primary)", marginBottom: 16 }}
          />
          <h1 style={{ fontSize: "28px", lineHeight: "36px", fontWeight: 700, margin: "0 0 8px 0" }}>
            404 — Page introuvable
          </h1>
          <p style={{ fontSize: "15px", lineHeight: "22px", color: "var(--color-on-surface-variant)", margin: "0 0 24px 0" }}>
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Link to="/" style={{ textDecoration: "none" }}>
            <Button icon="home">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
