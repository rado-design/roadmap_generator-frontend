import { Link } from "react-router";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import { Footer } from "../../shared/components/Footer";
import styles from "./HomePage.module.scss";

export function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand} aria-label="RoadmapAI Accueil">
            <Icon name="route" className={styles.brandIcon} />
            <span className={styles.brandName}>RoadmapAI</span>
          </Link>
          <div className={styles.headerActions}>
            <Link to="/login">
              <Button variant="outline" type="button" style={{ width: "auto" }}>
                Se connecter
              </Button>
            </Link>
            <Link to="/register">
              <Button type="button" style={{ width: "auto" }}>
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.hero}>
        <div className={styles.heroBadge}>
          <Icon name="auto_awesome" style={{ fontSize: 16 }} />
          <span>Génération intelligente par IA</span>
        </div>

        <h1 className={styles.heroTitle}>
          Structurez votre progression sans friction
        </h1>

        <p className={styles.heroSubtitle}>
          Générez des roadmaps personnalisées et suivez votre apprentissage étape par étape, avec zéro configuration manuelle.
        </p>

        <div className={styles.heroCtaRow}>
          <Link to="/register" style={{ textDecoration: "none", flex: 1 }}>
            <Button icon="arrow_forward">
              Créer ma première roadmap
            </Button>
          </Link>
          <Link to="/login" style={{ textDecoration: "none", flex: 1 }}>
            <Button variant="outline">
              Reprendre un parcours
            </Button>
          </Link>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <Icon name="bolt" className={styles.featureIcon} />
            <h2 className={styles.featureTitle}>Zéro setup</h2>
            <p className={styles.featureText}>
              Décrivez votre objectif en langage naturel, l'IA construit votre parcours adapté sans réglages complexes.
            </p>
          </div>

          <div className={styles.featureCard}>
            <Icon name="checklist" className={styles.featureIcon} />
            <h2 className={styles.featureTitle}>Jalons concrets</h2>
            <p className={styles.featureText}>
              Des étapes claires avec ressources ciblées et critères de validation pour mesurer votre réel avancement.
            </p>
          </div>

          <div className={styles.featureCard}>
            <Icon name="devices" className={styles.featureIcon} />
            <h2 className={styles.featureTitle}>Mobile & Desktop</h2>
            <p className={styles.featureText}>
              Consultez vos étapes et validez vos acquis aussi facilement sur smartphone que sur grand écran.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
