import { apiClient } from "../../../shared/lib/axios";

export interface DashboardRoadmap {
  id: number;
  title: string;
  goal: string;
  status: "generating" | "ready" | "failed";
  created_at: string;
  total_steps: number;
  completed_steps: number;
}

export interface DashboardRoadmapsResponse {
  items: DashboardRoadmap[];
  total: number;
  limit: number;
  offset: number;
}

/** Charge les roadmaps récentes via l'endpoint de liste déjà disponible. */
export async function getDashboardRoadmaps() {
  const response = await apiClient.get<DashboardRoadmapsResponse>(
    "api/v1/roadmaps?limit=100&offset=0",
  );
  return response.data;
}
