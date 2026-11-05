import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RoadmapDetail } from "../api/getRoadmapDetail";
import {
  acceptResourceAdjustment,
  proposeResourceAdjustment,
  rejectResourceAdjustment,
} from "../api/resourceAdjustments";

export function useProposeResourceAdjustment(roadmapId: number) {
  return useMutation({
    mutationFn: ({ stepId, instruction }: { stepId: number; instruction?: string }) =>
      proposeResourceAdjustment(roadmapId, stepId, instruction),
  });
}

interface DecideResourceAdjustmentVariables {
  stepId: number;
  adjustmentId: number;
  decision: "accept" | "reject";
}

export function useDecideResourceAdjustment(roadmapId: number) {
  const queryClient = useQueryClient();
  const detailKey = ["roadmaps", "detail", roadmapId] as const;

  return useMutation({
    mutationFn: async ({ stepId, adjustmentId, decision }: DecideResourceAdjustmentVariables) => {
      if (decision === "accept") {
        return acceptResourceAdjustment(roadmapId, stepId, adjustmentId);
      }
      await rejectResourceAdjustment(roadmapId, stepId, adjustmentId);
      return null;
    },
    onSuccess: (updatedStep) => {
      if (!updatedStep) return;
      queryClient.setQueryData<RoadmapDetail>(detailKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          steps: current.steps.map((step) => step.id === updatedStep.id ? updatedStep : step),
        };
      });
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: detailKey }),
        queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] }),
      ]);
    },
  });
}
