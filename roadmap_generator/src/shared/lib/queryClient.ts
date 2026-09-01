import { QueryClient } from "@tanstack/react-query";
import type { ApiError } from "../types";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min avant refetch auto
      retry: (failureCount, error) => {
        const status = (error as ApiError).status;
        // Ne pas retry sur les erreurs client (400-499)
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
