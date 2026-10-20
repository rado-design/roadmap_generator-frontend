import { useEffect, useState, type ReactNode } from "react";
import { Footer } from "../../shared/components/Footer";
import { AppTopBar } from "../../shared/components/AppTopBar";
import { Sidebar } from "../../shared/components/Sidebar";
import styles from "./AppLayout.module.scss";

interface AppLayoutProps {
  children: ReactNode;
  headerActions?: ReactNode;
  contentClassName?: string;
  onSearch?: (query: string) => void;
}

/** Cadre commun des pages de l'application, distinct du shell public/auth. */
export function AppLayout({
  children,
  headerActions,
  contentClassName,
  onSearch,
}: AppLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const closeSidebar = () => setMobileSidebarOpen(false);

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileSidebarOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileSidebarOpen]);

  return (
    <div className={styles.layout}>
      <Sidebar mobileOpen={mobileSidebarOpen} onNavigate={closeSidebar} />
      {mobileSidebarOpen ? (
        <button
          className={styles.backdrop}
          type="button"
          aria-label="Fermer la navigation"
          onClick={closeSidebar}
        />
      ) : null}

      <div className={styles.workspace}>
        <AppTopBar
          actions={headerActions}
          onMenuClick={() => setMobileSidebarOpen((open) => !open)}
          onSearch={onSearch}
          sidebarOpen={mobileSidebarOpen}
        />

        <main className={styles.main}>
          <div className={`${styles.content} ${contentClassName ?? ""}`.trim()}>
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
