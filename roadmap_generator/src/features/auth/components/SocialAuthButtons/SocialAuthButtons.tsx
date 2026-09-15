import { Button } from "../../../../shared/components/Button";
import styles from "./SocialAuthButtons.module.css";

/**
 * Boutons OAuth Google/Apple — purement visuels pour l'instant : le backend
 * n'expose pas encore d'endpoint OAuth (voir app/schemas/user.py). Désactivés
 * en attendant l'implémentation côté serveur.
 */
export function SocialAuthButtons() {
  return (
    <div className={styles.grid}>
      <Button
        type="button"
        variant="outline"
        disabled
        title="Bientôt disponible"
      >
        Google
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled
        title="Bientôt disponible"
      >
        Apple
      </Button>
    </div>
  );
}
