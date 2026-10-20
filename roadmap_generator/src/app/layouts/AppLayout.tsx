import type { ReactNode } from "react";
import { Link } from "react-router";
import { Footer } from "../../shared/components/Footer";
import { Icon } from "../../shared/components/Icon";
import styles from "./AppLayout.module.scss";

interface AppLayoutProps {
  children: ReactNode;
  headerActions?: ReactNode;
  contentClassName?: string;
}

/** Cadre commun des pages de l'application, distinct du shell public/auth. */
export function AppLayout({
  children,
  headerActions,
  contentClassName,
}: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand} aria-label="RoadmapAI, accueil">
            <Icon name="route" className={styles.brandIcon} />
            <span>RoadmapAI</span>
          </Link>
          {headerActions ? (
            <div className={styles.headerActions}>{headerActions}</div>
          ) : null}
        </div>
      </header>

      <main className={styles.main}>
        <div className={`${styles.content} ${contentClassName ?? ""}`.trim()}>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
