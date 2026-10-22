import { apiClient } from "../../../shared/lib/axios";

export type RoadmapStatus = "generating" | "ready" | "failed";
export type RoadmapCategoryGroup =
  | "tech"
  | "languages"
  | "sciences"
  | "business"
  | "creative"
  | "trades"
  | "life"
  | "hobbies"
  | "other";
export type RoadmapSort = "recent" | "oldest" | "progress";

export interface RoadmapSummary {
  id: number;
  title: string;
  goal: string;
  status: RoadmapStatus;
  category: RoadmapCategoryGroup;
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

export interface RoadmapListParams {
  limit: number;
  offset: number;
  search?: string;
  status?: RoadmapStatus;
  category?: RoadmapCategoryGroup;
  sort?: RoadmapSort;
}

export async function listRoadmaps(params: RoadmapListParams) {
  const response = await apiClient.get<RoadmapListResponse>("api/v1/roadmaps", {
    params,
  });
  return response.data;
}
