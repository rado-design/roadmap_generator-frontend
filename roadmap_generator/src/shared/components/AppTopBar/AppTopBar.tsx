import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { Icon } from "../Icon";
import styles from "./AppTopBar.module.scss";

interface AppTopBarProps {
  actions?: ReactNode;
  onMenuClick: () => void;
  onSearch?: (query: string) => void;
  sidebarOpen: boolean;
}

export function AppTopBar({
  actions,
  onMenuClick,
  onSearch,
  sidebarOpen,
}: AppTopBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (normalizedQuery) onSearch?.(normalizedQuery);
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.inner}>
        <button
          className={styles.menuButton}
          type="button"
          aria-label={sidebarOpen ? "Fermer la navigation" : "Ouvrir la navigation"}
          aria-controls="app-sidebar"
          aria-expanded={sidebarOpen}
          onClick={onMenuClick}
        >
          <Icon name="menu" />
        </button>

        <Link className={styles.brand} to="/dashboard" aria-label="RoadmapAI, tableau de bord">
          RoadmapAI
        </Link>

        <form className={styles.search} role="search" onSubmit={handleSubmit}>
          <label className={styles.visuallyHidden} htmlFor="app-search">
            Rechercher une roadmap
          </label>
          <Icon name="search" className={styles.searchIcon} />
          <input
            id="app-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une roadmap…"
            autoComplete="off"
          />
        </form>

        <div className={styles.actions}>
          {actions}
          <button
            className={styles.utilityButton}
            type="button"
            disabled
            aria-label="Notifications bientôt disponibles"
            title="Les notifications seront disponibles prochainement."
          >
            <Icon name="notifications" />
          </button>
          <button
            className={styles.utilityButton}
            type="button"
            disabled
            aria-label="Changement de thème bientôt disponible"
            title="Le changement de thème sera disponible prochainement."
          >
            <Icon name="dark_mode" />
          </button>
          <span className={styles.avatar} role="img" aria-label="Profil">
            <Icon name="person" />
          </span>
        </div>
      </div>
    </header>
  );
}
