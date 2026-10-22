import { apiClient } from "../../../shared/lib/axios";

export interface DashboardRoadmap {
  id: number;
  title: string;
  goal: string;
  status: "generating" | "ready" | "failed";
  category: string;
  created_at: string;
  total_steps: number;
  completed_steps: number;
}

export interface DashboardDistributionItem {
  key: string;
  count: number;
  percent: number;
}

export interface DashboardResponse {
  user: { display_name: string | null };
  roadmaps: {
    total: number;
    completed: number;
    in_progress: number;
    not_started: number;
  };
  completion_rate: number | null;
  status_distribution: DashboardDistributionItem[];
  category_distribution: DashboardDistributionItem[];
  recent_roadmaps: DashboardRoadmap[];
}

/** Charge les agrégats et les roadmaps récentes du tableau de bord. */
export async function getDashboardRoadmaps() {
  const response = await apiClient.get<DashboardResponse>("api/v1/dashboard");
  return response.data;
}
