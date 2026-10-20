import { apiClient } from "../../../shared/lib/axios";
import type { RoadmapStatus } from "./listRoadmaps";

export type StepProgressStatus = "todo" | "in_progress" | "done";

export interface RoadmapResource {
  title: string;
  url: string | null;
  type: string;
}

export interface RoadmapStep {
  id: number;
  order: number;
  title: string;
  description: string;
  estimated_duration_days: number | null;
  learning_objectives: string[];
  resources: RoadmapResource[];
  progress: {
    status: StepProgressStatus;
    started_at: string | null;
    completed_at: string | null;
  };
}

export interface RoadmapDetail {
  id: number;
  title: string;
  goal: string;
  status: RoadmapStatus;
  created_at: string;
  total_steps: number;
  completed_steps: number;
  steps: RoadmapStep[];
}

export async function getRoadmapDetail(roadmapId: number) {
  const response = await apiClient.get<RoadmapDetail>(`api/v1/roadmaps/${roadmapId}`);
  return response.data;
}
