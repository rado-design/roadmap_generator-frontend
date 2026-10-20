import { useQuery } from "@tanstack/react-query";
import { getDashboardRoadmaps } from "../api/getDashboardRoadmaps";

export function useDashboardRoadmaps() {
  return useQuery({
    queryKey: ["dashboard", "roadmaps"],
    queryFn: getDashboardRoadmaps,
  });
}
