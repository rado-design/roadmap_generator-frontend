import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../shared/lib/authStore";
import { apiClient } from "../../shared/lib/axios";
import { queryClient } from "../../shared/lib/queryClient";
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string>();
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);
  const navigate = useNavigate();
  const closeSidebar = () => setMobileSidebarOpen(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(undefined);
    try {
      await apiClient.post("api/v1/auth/logout");
      queryClient.clear();
      clearAccessToken();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("Déconnexion impossible. Vérifiez votre connexion puis réessayez.");
    } finally {
      setIsLoggingOut(false);
    }
  };

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
      <AppTopBar
        actions={headerActions}
        onMenuClick={() => setMobileSidebarOpen((open) => !open)}
        onSearch={onSearch}
        sidebarOpen={mobileSidebarOpen}
      />

      <div className={styles.shell}>
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          isLoggingOut={isLoggingOut}
          logoutError={logoutError}
          onLogout={() => void handleLogout()}
          onNavigate={closeSidebar}
        />
        {mobileSidebarOpen ? (
          <button
            className={styles.backdrop}
            type="button"
            aria-label="Fermer la navigation"
            onClick={closeSidebar}
          />
        ) : null}

        <div className={styles.workspace}>
          <main className={styles.main}>
            <div className={`${styles.content} ${contentClassName ?? ""}`.trim()}>
              {children}
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
