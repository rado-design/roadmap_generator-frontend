import { apiClient } from "../../../shared/lib/axios";

export async function setRoadmapArchived(roadmapId: number, archived: boolean) {
  await apiClient.post(`api/v1/roadmaps/${roadmapId}/${archived ? "archive" : "unarchive"}`);
}
