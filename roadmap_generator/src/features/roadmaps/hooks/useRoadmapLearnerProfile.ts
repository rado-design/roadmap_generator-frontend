import { useQuery } from "@tanstack/react-query";
import { getRoadmapLearnerProfile } from "../api/getRoadmapLearnerProfile";

export function useRoadmapLearnerProfile(roadmapId: number | null) {
  return useQuery({
    queryKey: ["roadmaps", "detail", roadmapId, "learner-profile"],
    queryFn: () => {
      if (roadmapId === null) throw new Error("Identifiant de roadmap invalide.");
      return getRoadmapLearnerProfile(roadmapId);
    },
    enabled: roadmapId !== null,
  });
}
