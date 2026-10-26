import { Link } from "react-router";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import { Footer } from "../../shared/components/Footer";
import styles from "./HomePage.module.scss";

const FEATURES = [
  {
    icon: "bolt",
    title: "Zéro setup",
    text: "Décrivez votre objectif en langage naturel, l'IA construit votre parcours adapté sans réglages complexes.",
  },
  {
    icon: "checklist",
    title: "Jalons concrets",
    text: "Des étapes claires avec ressources ciblées et critères de validation pour mesurer votre réel avancement.",
  },
  {
    icon: "devices",
    title: "Mobile & Desktop",
    text: "Consultez vos étapes et validez vos acquis aussi facilement sur smartphone que sur grand écran.",
  },
] as const;

export function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand} aria-label="RoadmapAI — Accueil">
            <Icon name="route" className={styles.brandIcon} aria-hidden="true" />
            <span className={styles.brandName}>RoadmapAI</span>
          </Link>
          <nav className={styles.headerActions} aria-label="Navigation principale">
            <Link to="/login" className={styles.navLink}>
              <Button variant="outline" type="button" style={{ width: "auto" }}>
                Se connecter
              </Button>
            </Link>
            <Link to="/register" className={styles.navLink}>
              <Button type="button" style={{ width: "auto" }}>
                Commencer
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-heading">
          <h1 id="hero-heading" className={styles.heroTitle}>
            Structurez votre progression sans friction
          </h1>

          <p className={styles.heroSubtitle}>
            Générez des roadmaps personnalisées et suivez votre apprentissage étape par étape, avec zéro configuration manuelle.
          </p>

          <div className={styles.heroCtaRow}>
            <Link to="/register" className={styles.ctaLink}>
              <Button icon="arrow_forward">
                Créer ma première roadmap
              </Button>
            </Link>
            <Link to="/login" className={styles.ctaLink}>
              <Button variant="outline">
                Reprendre un parcours
              </Button>
            </Link>
          </div>
        </section>

        <section className={styles.features} aria-label="Fonctionnalités clés">
          <ul className={styles.featureGrid} role="list">
            {FEATURES.map(({ icon, title, text }) => (
              <li key={title} className={styles.featureCard}>
                <Icon name={icon} className={styles.featureIcon} aria-hidden="true" />
                <h2 className={styles.featureTitle}>{title}</h2>
                <p className={styles.featureText}>{text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
