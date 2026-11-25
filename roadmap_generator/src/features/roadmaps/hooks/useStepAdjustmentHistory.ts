import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStepAdjustmentHistory, restoreStepAdjustmentHistory } from "../api/stepAdjustmentHistory";

export const stepAdjustmentHistoryKey = (roadmapId: number, stepId: number) =>
  ["roadmaps", "step-adjustment-history", roadmapId, stepId] as const;

export function useStepAdjustmentHistory(roadmapId: number, stepId: number) {
  return useQuery({
    queryKey: stepAdjustmentHistoryKey(roadmapId, stepId),
    queryFn: () => getStepAdjustmentHistory(roadmapId, stepId),
    enabled: roadmapId > 0 && stepId > 0,
  });
}

export function useRestoreStepAdjustmentHistory(roadmapId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, adjustmentId }: { stepId: number; adjustmentId: number }) =>
      restoreStepAdjustmentHistory(roadmapId, stepId, adjustmentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["roadmaps", "detail", roadmapId] }),
        queryClient.invalidateQueries({ queryKey: ["roadmaps", "step-adjustment-history", roadmapId] }),
        queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] }),
      ]);
    },
  });
}
