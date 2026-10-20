import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "../shared/lib/authStore";

interface RouteGuardProps {
  children: ReactNode;
}

/** Redirige les utilisateurs connectés hors des pages publiques d'entrée. */
export function PublicOnlyRoute({ children }: RouteGuardProps) {
  const status = useAuthStore((state) => state.status);

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/** Réserve les pages de l'espace de travail aux sessions restaurées/actives. */
export function RequireAuthRoute({ children }: RouteGuardProps) {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
