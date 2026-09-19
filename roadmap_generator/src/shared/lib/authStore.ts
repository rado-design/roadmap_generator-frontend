import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface AuthState {
  /**
   * En mémoire uniquement — jamais persisté (ni localStorage, ni cookie JS).
   * Il disparaît donc à chaque refresh de page/fermeture d'onglet, c'est
   * voulu : voir app/SessionBootstrap.tsx qui restaure la session au
   * chargement via le cookie HttpOnly refresh_token (invisible en JS, géré
   * exclusivement par le backend — shared/lib/axios.ts).
   */
  accessToken: string | null;
  /**
   * "idle" tant que le bootstrap initial n'a pas résolu, puis
   * "authenticated"/"unauthenticated" une fois qu'on sait si le cookie a
   * permis de restaurer une session.
   */
  status: "idle" | "authenticated" | "unauthenticated";
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
}

/**
 * Placé dans shared/lib (et non dans features/auth) car consommé par
 * apiClient (shared/lib/axios.ts) pour attacher le header Authorization —
 * shared ne doit jamais dépendre de features/.
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      accessToken: null,
      status: "idle",
      setAccessToken: (token) => set({ accessToken: token, status: "authenticated" }),
      clearAccessToken: () => set({ accessToken: null, status: "unauthenticated" }),
    }),
    { name: "auth", enabled: import.meta.env.DEV },
  ),
);
