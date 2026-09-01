import axios, { AxiosError } from "axios";
import type { ApiError } from "../types";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    const apiError: ApiError = {
      message:
        error.response?.data?.message ??
        error.message ??
        "Une erreur inattendue est survenue.",
      status: error.response?.status,
      code: error.response?.data?.code,
    };

    return Promise.reject(apiError);
  },
);
