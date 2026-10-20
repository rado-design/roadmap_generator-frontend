import { useQuery } from "@tanstack/react-query";
import { getRoadmapDetail } from "../api/getRoadmapDetail";

export function useRoadmapDetail(roadmapId: number | null) {
  return useQuery({
    queryKey: ["roadmaps", "detail", roadmapId],
    queryFn: () => {
      if (roadmapId === null) throw new Error("Identifiant de roadmap invalide.");
      return getRoadmapDetail(roadmapId);
    },
    enabled: roadmapId !== null,
  });
}
