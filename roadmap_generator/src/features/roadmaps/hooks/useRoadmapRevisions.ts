import { useQuery } from "@tanstack/react-query";
import { listRoadmapRevisions } from "../api/listRoadmapRevisions";

export function useRoadmapRevisions(roadmapId: number | null) {
  return useQuery({
    queryKey: ["roadmaps", "revisions", roadmapId],
    queryFn: () => {
      if (roadmapId === null) throw new Error("Identifiant de roadmap invalide.");
      return listRoadmapRevisions(roadmapId);
    },
    enabled: roadmapId !== null,
  });
}
