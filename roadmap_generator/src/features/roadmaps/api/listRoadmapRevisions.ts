import { apiClient } from "../../../shared/lib/axios";

export interface RevisionResource { title: string; url: string | null; type: string }
export interface ReplacedStep {
  id: number | null;
  order: number;
  title: string;
  description: string;
  estimated_duration_days: number | null;
  learning_objectives: string[];
  resources: RevisionResource[];
}
export interface RevisionStepLink { created_step_id: number; replaced_step_id: number | null }
export interface RoadmapRevision {
  id: number;
  created_at: string;
  instruction: string | null;
  created_step_ids: number[];
  replaced_steps: ReplacedStep[];
  step_links: RevisionStepLink[] | null;
  is_latest: boolean;
}
export interface RoadmapRevisionList { items: RoadmapRevision[] }

export async function listRoadmapRevisions(roadmapId: number) {
  const response = await apiClient.get<RoadmapRevisionList>(`api/v1/roadmaps/${roadmapId}/adapt/revisions`);
  return response.data;
}
