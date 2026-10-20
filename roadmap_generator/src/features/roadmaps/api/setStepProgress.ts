import { apiClient } from "../../../shared/lib/axios";
import type { StepProgressStatus } from "./getRoadmapDetail";

export interface StepProgressResponse {
  step_id: number;
  status: StepProgressStatus;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export async function setStepProgress(
  roadmapId: number,
  stepId: number,
  status: StepProgressStatus,
) {
  const response = await apiClient.put<StepProgressResponse>(
    `api/v1/roadmaps/${roadmapId}/steps/${stepId}/progress`,
    { status },
  );
  return response.data;
}
