import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adaptRoadmap, undoAdaptedStep, undoRoadmapAdaptation } from "../api/adaptRoadmap";

async function invalidateAdaptationQueries(queryClient: ReturnType<typeof useQueryClient>, roadmapId: number, detailKey: readonly unknown[]) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: detailKey }),
    queryClient.invalidateQueries({ queryKey: ["roadmaps", "revisions", roadmapId] }),
    queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
    queryClient.invalidateQueries({ queryKey: ["resources"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}

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
        queryClient.invalidateQueries({ queryKey: ["roadmaps", "revisions", roadmapId] }),
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
      await invalidateAdaptationQueries(queryClient, roadmapId, detailKey);
    },
  });
}

export function useUndoAdaptedStep(roadmapId: number) {
  const queryClient = useQueryClient();
  const detailKey = ["roadmaps", "detail", roadmapId] as const;

  return useMutation({
    mutationFn: (createdStepId: number) => undoAdaptedStep(roadmapId, createdStepId),
    onSuccess: (roadmap) => queryClient.setQueryData(detailKey, roadmap),
    onSettled: async () => invalidateAdaptationQueries(queryClient, roadmapId, detailKey),
  });
}
