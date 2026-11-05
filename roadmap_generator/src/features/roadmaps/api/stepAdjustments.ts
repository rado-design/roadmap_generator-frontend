import { apiClient } from "../../../shared/lib/axios";
import type { RoadmapResource, RoadmapStep } from "./getRoadmapDetail";

export interface StepContent {
  title: string;
  description: string;
  estimated_duration_days: number | null;
  learning_objectives: string[];
  resources: RoadmapResource[];
}

export interface StepAdjustment {
  id: number;
  step_id: number;
  status: "pending" | "accepted" | "rejected";
  instruction: string;
  created_at: string;
  decided_at: string | null;
  current: StepContent;
  proposed: StepContent;
}

export async function proposeStepAdjustment(roadmapId: number, stepId: number, instruction: string) {
  const response = await apiClient.post<StepAdjustment>(
    `api/v1/roadmaps/${roadmapId}/steps/${stepId}/adjustments`,
    { instruction },
  );
  return response.data;
}

export async function acceptStepAdjustment(roadmapId: number, stepId: number, adjustmentId: number) {
  const response = await apiClient.post<RoadmapStep>(
    `api/v1/roadmaps/${roadmapId}/steps/${stepId}/adjustments/${adjustmentId}/accept`,
  );
  return response.data;
}

export async function rejectStepAdjustment(roadmapId: number, stepId: number, adjustmentId: number) {
  await apiClient.post(
    `api/v1/roadmaps/${roadmapId}/steps/${stepId}/adjustments/${adjustmentId}/reject`,
  );
}
