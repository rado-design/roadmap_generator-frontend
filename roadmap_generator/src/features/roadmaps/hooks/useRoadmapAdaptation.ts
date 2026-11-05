import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adaptRoadmap, undoRoadmapAdaptation } from "../api/adaptRoadmap";

export function useAdaptRoadmap(roadmapId: number) {
  const queryClient = useQueryClient();
  const detailKey = ["roadmaps", "detail", roadmapId] as const;

  return useMutation({
    mutationFn: ({ instruction, onEvent }: {
      instruction?: string;
      onEvent: Parameters<typeof adaptRoadmap>[2];
    }) => adaptRoadmap(roadmapId, instruction, onEvent),
    onSuccess: (roadmap) => queryClient.setQueryData(detailKey, roadmap),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: detailKey }),
        queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useUndoRoadmapAdaptation(roadmapId: number) {
  const queryClient = useQueryClient();
  const detailKey = ["roadmaps", "detail", roadmapId] as const;

  return useMutation({
    mutationFn: () => undoRoadmapAdaptation(roadmapId),
    onSuccess: (roadmap) => queryClient.setQueryData(detailKey, roadmap),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: detailKey }),
        queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}
