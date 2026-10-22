import { useQuery } from "@tanstack/react-query";
import { listRoadmaps, type RoadmapCategoryGroup, type RoadmapSort, type RoadmapStatus } from "../api/listRoadmaps";

export const ROADMAPS_PAGE_SIZE = 20;

export interface UseRoadmapsParams {
  offset: number;
  search: string;
  status: RoadmapStatus | "all";
  category: RoadmapCategoryGroup | "all";
  sort: RoadmapSort;
}

export function useRoadmaps({ offset, search, status, category, sort }: UseRoadmapsParams) {
  const params = {
    limit: ROADMAPS_PAGE_SIZE,
    offset,
    search: search.trim() || undefined,
    status: status === "all" ? undefined : status,
    category: category === "all" ? undefined : category,
    sort,
  };

  return useQuery({
    queryKey: ["roadmaps", params],
    queryFn: () => listRoadmaps(params),
  });
}
