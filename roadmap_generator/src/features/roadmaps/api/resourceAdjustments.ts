import { apiClient } from "../../../shared/lib/axios";
import type { RoadmapResource, RoadmapStep } from "./getRoadmapDetail";

export interface ResourceAdjustment {
  id: number;
  step_id: number;
  status: "pending" | "accepted" | "rejected";
  instruction: string | null;
  created_at: string;
  decided_at: string | null;
  current: RoadmapResource[];
  proposed: RoadmapResource[];
}

export async function proposeResourceAdjustment(
  roadmapId: number,
  stepId: number,
  instruction?: string,
) {
  const response = await apiClient.post<ResourceAdjustment>(
    `api/v1/roadmaps/${roadmapId}/steps/${stepId}/resource-adjustments`,
    instruction ? { instruction } : {},
  );
  return response.data;
}

export async function acceptResourceAdjustment(roadmapId: number, stepId: number, adjustmentId: number) {
  const response = await apiClient.post<RoadmapStep>(
    `api/v1/roadmaps/${roadmapId}/steps/${stepId}/resource-adjustments/${adjustmentId}/accept`,
  );
  return response.data;
}

export async function rejectResourceAdjustment(roadmapId: number, stepId: number, adjustmentId: number) {
  await apiClient.post(
    `api/v1/roadmaps/${roadmapId}/steps/${stepId}/resource-adjustments/${adjustmentId}/reject`,
  );
}
