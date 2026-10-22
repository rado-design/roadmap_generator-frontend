import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateRoadmap } from "../api/generateRoadmap";

export function useGenerateRoadmap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      onEvent,
      signal,
    }: {
      payload: Parameters<typeof generateRoadmap>[0];
      onEvent: Parameters<typeof generateRoadmap>[1];
      signal?: AbortSignal;
    }) => generateRoadmap(payload, onEvent, signal),
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}
