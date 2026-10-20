import { apiClient } from "../../../shared/lib/axios";
import type { RoadmapDetail } from "./getRoadmapDetail";

export type RoadmapCategory =
  | "programming"
  | "mobile_dev"
  | "marketing_sales"
  | "project_management"
  | "ux_ui_design"
  | "other";
export type LearnerLevel = "none" | "beginner" | "intermediate" | "advanced";

export interface GenerateRoadmapRequest {
  goal: string;
  category: RoadmapCategory;
  level: LearnerLevel;
  weekly_hours: number;
  deadline_weeks: number | null;
  background: string | null;
}

export async function generateRoadmap(payload: GenerateRoadmapRequest) {
  const response = await apiClient.post<RoadmapDetail>("api/v1/roadmaps/generate", payload);
  return response.data;
}
