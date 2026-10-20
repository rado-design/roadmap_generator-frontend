import { apiClient } from "../../../shared/lib/axios";

export type RoadmapStatus = "generating" | "ready" | "failed";

export interface RoadmapSummary {
  id: number;
  title: string;
  goal: string;
  status: RoadmapStatus;
  created_at: string;
  total_steps: number;
  completed_steps: number;
}

export interface RoadmapListResponse {
  items: RoadmapSummary[];
  total: number;
  limit: number;
  offset: number;
}

export async function listRoadmaps(limit: number, offset: number) {
  const response = await apiClient.get<RoadmapListResponse>(
    `api/v1/roadmaps?limit=${limit}&offset=${offset}`,
  );
  return response.data;
}
