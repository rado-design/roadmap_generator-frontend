import { apiClient } from "../../../shared/lib/axios";

export type ResourceCategory =
  | "tech"
  | "languages"
  | "sciences"
  | "business"
  | "creative"
  | "trades"
  | "life"
  | "hobbies"
  | "other";

export type ResourceSort = "recent" | "oldest";
export type StepProgressStatus = "todo" | "in_progress" | "done";

export interface ResourceItem {
  id: number;
  title: string;
  url: string | null;
  type: string;
  created_at: string;
  category: ResourceCategory;
  is_favorite: boolean;
  step: { id: number; order: number; title: string; status: StepProgressStatus };
  roadmap: { id: number; title: string };
}

export interface ResourceListResponse {
  items: ResourceItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ResourceListParams {
  limit: number;
  offset: number;
  search?: string;
  category?: ResourceCategory;
  roadmap_id?: number;
  type?: string;
  created_from?: string;
  created_to?: string;
  sort?: ResourceSort;
  favorite?: boolean;
  step_status?: StepProgressStatus;
}

export async function listResources(params: ResourceListParams) {
  const response = await apiClient.get<ResourceListResponse>("api/v1/resources", { params });
  return response.data;
}
