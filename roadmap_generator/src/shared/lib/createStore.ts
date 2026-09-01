import { create as zustandCreate, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * Wrapper autour de zustand `create` : ajoute Redux DevTools automatiquement
 * (désactivé en prod) et nomme le store pour le débogage.
 *
 * Usage dans une feature :
 *   export const useAuthStore = createStore<AuthState>("auth", (set) => ({
 *     user: null,
 *     setUser: (user) => set({ user }),
 *   }));
 */
export function createStore<T>(
  name: string,
  initializer: StateCreator<T>,
) {
  return zustandCreate<T>()(
    devtools(initializer, { name, enabled: import.meta.env.DEV }),
  );
}
