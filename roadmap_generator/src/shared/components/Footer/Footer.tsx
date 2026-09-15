import styles from "./Footer.module.scss";


export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.innerContainer}>
        <div className={styles.copyright}>
          <span>© 2025 RoadmapAI par Skyline Systems. Tous droits réservés.</span>
        </div>
        <div className={styles.navLinks}>
          <a
            href="#"
            className={styles.link}
            onClick={(e) => e.preventDefault()}
          >
            Support &amp; Aide
          </a>
          <a
            href="#"
            className={styles.link}
            onClick={(e) => e.preventDefault()}
          >
            Mentions Légales
          </a>
          <a
            href="#"
            className={styles.link}
            onClick={(e) => e.preventDefault()}
          >
            Politique de Confidentialité
          </a>
        </div>
      </div>
    </footer>
  );
}
