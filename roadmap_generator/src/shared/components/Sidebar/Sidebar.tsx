import { NavLink } from "react-router";
import { Icon } from "../Icon";
import styles from "./Sidebar.module.scss";

interface SidebarProps {
  mobileOpen: boolean;
  onNavigate: () => void;
}

const navigation = [
  { to: "/dashboard", label: "Tableau de bord", icon: "dashboard", end: true },
  { to: "/roadmaps", label: "Toutes les roadmaps", icon: "route", end: false },
  { to: "/resources", label: "Ressources", icon: "book_2", end: false },
  { to: "/settings", label: "Paramètres", icon: "settings", end: false },
];

export function Sidebar({ mobileOpen, onNavigate }: SidebarProps) {
  return (
    <aside
      id="app-sidebar"
      className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ""}`.trim()}
      aria-label="Navigation principale"
    >
      <NavLink
        to="/dashboard"
        className={styles.brand}
        aria-label="RoadmapAI, tableau de bord"
        onClick={onNavigate}
      >
        <Icon name="route" className={styles.brandIcon} />
        <span>RoadmapAI</span>
      </NavLink>

      <NavLink to="/roadmaps/new" className={styles.createLink} onClick={onNavigate}>
        <Icon name="add" />
        <span>Créer une roadmap</span>
      </NavLink>

      <nav className={styles.navigation}>
        <p className={styles.sectionLabel}>Espace de travail</p>
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
    </aside>
  );
}
