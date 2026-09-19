import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../shared/lib/authStore";
import { refreshAccessToken } from "../shared/lib/axios";

interface SessionBootstrapProps {
  children: ReactNode;
}

/**
 * Tente de restaurer la session au chargement de l'app via le cookie
 * HttpOnly refresh_token (voir shared/lib/axios.ts::refreshAccessToken).
 *
 * Le cookie n'est jamais lu en JS — on ne sait s'il existe/est valide qu'en
 * essayant l'appel. Un échec (absent, expiré) est silencieux : l'utilisateur
 * reste simplement déconnecté, ce n'est pas une erreur à afficher.
 *
 * Le rendu des routes est retardé jusqu'à résolution pour éviter un flash de
 * contenu "déconnecté" avant que la session ne soit restaurée.
 */
export function SessionBootstrap({ children }: SessionBootstrapProps) {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    refreshAccessToken();
  }, []);

  if (status === "idle") {
    return null;
  }

  return children;
}
