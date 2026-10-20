import { NavLink } from "react-router";
import { Icon } from "../Icon";
import styles from "./Sidebar.module.scss";

interface SidebarProps {
  mobileOpen: boolean;
  isLoggingOut: boolean;
  logoutError?: string;
  onLogout: () => void;
  onNavigate: () => void;
}

const navigation = [
  { to: "/dashboard", label: "Tableau de bord", icon: "dashboard", end: true },
  { to: "/roadmaps", label: "Roadmaps", icon: "map", end: false },
  { to: "/resources", label: "Ressources", icon: "menu_book", end: false },
  { to: "/settings", label: "Paramètres", icon: "settings", end: false },
];

export function Sidebar({
  mobileOpen,
  isLoggingOut,
  logoutError,
  onLogout,
  onNavigate,
}: SidebarProps) {
  return (
    <aside
      id="app-sidebar"
      className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ""}`.trim()}
      aria-label="Navigation principale"
    >
      <div className={styles.workspaceIdentity}>
        <span className={styles.workspaceIcon}>
          <Icon name="map" />
        </span>
        <span className={styles.workspaceCopy}>
          <strong>Mon espace</strong>
          <small>RoadmapAI</small>
        </span>
      </div>

      <nav className={styles.navigation} aria-label="Espace de travail">
        {navigation.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`.trim()
            }
          >
            <Icon name={icon} className={styles.navIcon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottomNavigation}>
        {logoutError ? (
          <p className={styles.logoutError} role="alert">
            {logoutError}
          </p>
        ) : null}
        <button
          className={styles.navLink}
          type="button"
          disabled
          title="Le centre d’aide sera disponible prochainement."
        >
          <Icon name="help_outline" className={styles.navIcon} />
          <span>Centre d’aide</span>
        </button>
        <button
          className={styles.navLink}
          type="button"
          onClick={() => {
            onNavigate();
            onLogout();
          }}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
        >
          <Icon name="logout" className={styles.navIcon} />
          <span>{isLoggingOut ? "Déconnexion…" : "Déconnexion"}</span>
        </button>
      </div>
    </aside>
  );
}
