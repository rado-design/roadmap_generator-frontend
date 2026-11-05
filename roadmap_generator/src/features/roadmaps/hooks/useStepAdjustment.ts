import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RoadmapDetail } from "../api/getRoadmapDetail";
import {
  acceptStepAdjustment,
  proposeStepAdjustment,
  rejectStepAdjustment,
} from "../api/stepAdjustments";

export function useProposeStepAdjustment(roadmapId: number) {
  return useMutation({
    mutationFn: ({ stepId, instruction }: { stepId: number; instruction: string }) =>
      proposeStepAdjustment(roadmapId, stepId, instruction),
  });
}

interface DecideStepAdjustmentVariables {
  stepId: number;
  adjustmentId: number;
  decision: "accept" | "reject";
}

export function useDecideStepAdjustment(roadmapId: number) {
  const queryClient = useQueryClient();
  const detailKey = ["roadmaps", "detail", roadmapId] as const;

  return useMutation({
    mutationFn: async ({ stepId, adjustmentId, decision }: DecideStepAdjustmentVariables) => {
      if (decision === "accept") {
        return acceptStepAdjustment(roadmapId, stepId, adjustmentId);
      }
      await rejectStepAdjustment(roadmapId, stepId, adjustmentId);
      return null;
    },
    onSuccess: (updatedStep) => {
      if (!updatedStep) return;
      queryClient.setQueryData<RoadmapDetail>(detailKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          steps: current.steps.map((step) => step.id === updatedStep.id ? updatedStep : step),
          completed_steps: updatedStep.progress.status === "done"
            ? current.completed_steps + 1
            : current.completed_steps,
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
