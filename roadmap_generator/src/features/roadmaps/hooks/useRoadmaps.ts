import { useQuery } from "@tanstack/react-query";
import { listRoadmaps } from "../api/listRoadmaps";

export const ROADMAPS_PAGE_SIZE = 20;

export function useRoadmaps(offset: number) {
  return useQuery({
    queryKey: ["roadmaps", { limit: ROADMAPS_PAGE_SIZE, offset }],
    queryFn: () => listRoadmaps(ROADMAPS_PAGE_SIZE, offset),
  });
}
