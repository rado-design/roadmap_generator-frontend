import { Link } from "react-router";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import styles from "./NotFoundPage.module.scss";

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <main className={styles.card} aria-labelledby="not-found-title">
        <Icon name="explore_off" className={styles.icon} aria-hidden="true" />
        <h1 id="not-found-title" className={styles.title}>Page introuvable</h1>
        <p className={styles.body}>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className={styles.cta}>
          <Button icon="home">Retour à l'accueil</Button>
        </Link>
      </main>
    </div>
  );
}
