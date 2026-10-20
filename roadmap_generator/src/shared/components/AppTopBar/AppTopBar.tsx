import { useState, type FormEvent, type ReactNode } from "react";
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

        <form className={styles.search} role="search" onSubmit={handleSubmit}>
          <label className={styles.visuallyHidden} htmlFor="app-search">
            Rechercher
          </label>
          <Icon name="search" className={styles.searchIcon} />
          <input
            id="app-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher"
            autoComplete="off"
          />
          <button className={styles.submitButton} type="submit" aria-label="Lancer la recherche">
            <Icon name="arrow_forward" />
          </button>
        </form>

        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}
