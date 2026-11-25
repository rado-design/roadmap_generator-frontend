import { apiClient } from "../../../shared/lib/axios";
import type { RoadmapStep } from "./getRoadmapDetail";

export interface StepAdjustmentHistoryItem {
  adjustment_id: number;
  step_id: number;
  adapted_at: string;
  previous: {
    title: string;
    description: string;
    estimated_duration_days: number | null;
    learning_objectives: string[];
    resources: RoadmapStep["resources"];
  };
  can_undo: boolean;
  restored_at: string | null;
}

export async function getStepAdjustmentHistory(roadmapId: number, stepId: number) {
  const response = await apiClient.get<{ items: StepAdjustmentHistoryItem[] }>(
    `api/v1/roadmaps/${roadmapId}/steps/${stepId}/adjustment-history`,
  );
  return response.data;
}

export async function restoreStepAdjustmentHistory(roadmapId: number, stepId: number, adjustmentId: number) {
  const response = await apiClient.post<RoadmapStep>(
    `api/v1/roadmaps/${roadmapId}/steps/${stepId}/adjustment-history/${adjustmentId}/restore`,
  );
  return response.data;
}
