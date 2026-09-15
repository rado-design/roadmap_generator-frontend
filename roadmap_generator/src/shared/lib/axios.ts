import axios, { AxiosError } from "axios";
import type { ApiError } from "../types";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,
});

/**
 * Le backend renvoie ses erreurs au format RFC 7807 (voir
 * app/core/exceptions.py::register_exception_handlers) :
 * { type, title, status, detail, instance } — pas de "message"/"code".
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; type?: string }>) => {
    const apiError: ApiError = {
      message:
        error.response?.data?.detail ??
        error.message ??
        "Une erreur inattendue est survenue.",
      status: error.response?.status,
      code: error.response?.data?.type,
    };

    return Promise.reject(apiError);
  },
);
