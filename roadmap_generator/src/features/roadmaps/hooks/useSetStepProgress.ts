import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setStepProgress } from "../api/setStepProgress";
import type { RoadmapDetail, StepProgressStatus } from "../api/getRoadmapDetail";

interface UpdateStepProgressVariables {
  roadmapId: number;
  stepId: number;
  status: StepProgressStatus;
}

function countCompleted(steps: RoadmapDetail["steps"]) {
  return steps.filter((step) => step.progress.status === "done").length;
}

export function useSetStepProgress(roadmapId: number | null) {
  const queryClient = useQueryClient();
  const queryKey = ["roadmaps", "detail", roadmapId] as const;

  return useMutation({
    mutationFn: ({ stepId, status }: UpdateStepProgressVariables) => {
      if (roadmapId === null) throw new Error("Identifiant de roadmap invalide.");
      return setStepProgress(roadmapId, stepId, status);
    },
    onMutate: async ({ stepId, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousRoadmap = queryClient.getQueryData<RoadmapDetail>(queryKey);

      if (previousRoadmap) {
        const steps = previousRoadmap.steps.map((step) => (
          step.id === stepId
            ? { ...step, progress: { ...step.progress, status } }
            : step
        ));
        queryClient.setQueryData<RoadmapDetail>(queryKey, {
          ...previousRoadmap,
          steps,
          completed_steps: countCompleted(steps),
        });
      }

      return { previousRoadmap };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousRoadmap) {
        queryClient.setQueryData(queryKey, context.previousRoadmap);
      }
    },
    onSuccess: (result) => {
      queryClient.setQueryData<RoadmapDetail>(queryKey, (current) => {
        if (!current) return current;
        const steps = current.steps.map((step) => (
          step.id === result.step_id
            ? {
              ...step,
              progress: {
                status: result.status,
                started_at: result.started_at,
                completed_at: result.completed_at,
              },
            }
            : step
        ));
        return { ...current, steps, completed_steps: countCompleted(steps) };
      });
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}
