import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "../types";
import { useAuthStore } from "./authStore";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // Le refresh token vit exclusivement dans un cookie HttpOnly posé par le
  // backend (jamais lu/écrit en JS) : withCredentials est nécessaire pour
  // qu'il parte avec les requêtes vers /auth/refresh et que les éventuels
  // Set-Cookie de réponse soient acceptés par le navigateur.
  withCredentials: true,
});

/**
 * Attache l'access token courant (en mémoire uniquement, voir authStore) à
 * chaque requête sortante.
 */
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
}

let refreshPromise: Promise<string | null> | null = null;

interface ApiErrorPayload {
  detail?: string;
  type?: string;
  quota?: string;
  generation_id?: string;
  limit?: number;
  used?: number;
  resets_at?: string | null;
  retry_after_seconds?: number;
}

function parseApiErrorPayload(data: unknown): ApiErrorPayload {
  let parsed = data;
  // Les endpoints SSE sont demandés avec responseType="text"; leurs erreurs
  // HTTP préalables (402/429/409) arrivent donc sous forme de chaîne JSON.
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      return {};
    }
  }
  return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
    ? parsed as ApiErrorPayload
    : {};
}

/**
 * Échange le cookie HttpOnly refresh_token contre un nouvel access token.
 *
 * Mutualisée : si plusieurs requêtes se prennent un 401 en même temps, une
 * seule requête /auth/refresh part réellement, les autres attendent le même
 * résultat. Ne lève jamais — un échec veut juste dire "pas de session
 * valide", pas une erreur à remonter à l'appelant.
 *
 * Exportée pour être appelée une première fois au chargement de l'app (voir
 * app/SessionBootstrap.tsx), en plus d'être réutilisée par l'intercepteur de
 * réponse ci-dessous pour rafraîchir silencieusement en cours de session.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      // Le bootstrap masque volontairement l'application pendant cette
      // requête. Sans délai maximal, une API inaccessible peut donc laisser
      // l'écran « Restauration de votre session… » affiché indéfiniment.
      .post<AccessTokenResponse>("api/v1/auth/refresh", undefined, { timeout: 15_000 })
      .then(({ data }) => {
        if (!data.access_token) {
          throw new Error("Le serveur n'a pas renvoyé de jeton d'accès.");
        }
        useAuthStore.getState().setAccessToken(data.access_token);
        return data.access_token;
      })
      .catch(() => {
        useAuthStore.getState().clearAccessToken();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Le backend renvoie ses erreurs au format RFC 7807 (voir
 * app/core/exceptions.py::register_exception_handlers) :
 * { type, title, status, detail, instance } — pas de "message"/"code".
 *
 * Sur un 401 hors endpoints /auth eux-mêmes, on tente un refresh silencieux
 * une seule fois puis on rejoue la requête d'origine avec le nouvel access
 * token. Si le refresh échoue aussi (cookie absent/expiré), l'erreur 401
 * d'origine remonte normalement à l'appelant.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<unknown>) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !isAuthEndpoint &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      }
    }

    const payload = parseApiErrorPayload(error.response?.data);
    const apiError: ApiError = {
      message:
        payload.detail ??
        error.message ??
        "Une erreur inattendue est survenue.",
      status: error.response?.status,
      code: payload.type,
      quota: payload.quota,
      generation_id: typeof payload.generation_id === "string"
        ? payload.generation_id
        : undefined,
      limit: typeof payload.limit === "number" ? payload.limit : undefined,
      used: typeof payload.used === "number" ? payload.used : undefined,
      resets_at: payload.resets_at,
      retry_after_seconds: typeof payload.retry_after_seconds === "number"
        ? payload.retry_after_seconds
        : undefined,
      retryable: !error.response || error.response.status >= 500 || error.response.status === 429,
    };

    return Promise.reject(apiError);
  },
);
