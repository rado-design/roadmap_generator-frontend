import { apiClient } from "../../../shared/lib/axios";
import type { LearnerLevel } from "./generateRoadmap";

export interface RoadmapLearnerProfile {
  goal: string;
  category: string;
  level: LearnerLevel;
}

export async function getRoadmapLearnerProfile(roadmapId: number) {
  const response = await apiClient.get<RoadmapLearnerProfile>(`api/v1/roadmaps/${roadmapId}/learner-profile`);
  return response.data;
}
