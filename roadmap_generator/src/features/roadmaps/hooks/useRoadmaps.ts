import { useInfiniteQuery } from "@tanstack/react-query";
import { listRoadmaps, type RoadmapCategoryGroup, type RoadmapSort, type RoadmapStatus } from "../api/listRoadmaps";

export const ROADMAPS_PAGE_SIZE = 20;

export interface UseRoadmapsParams {
  search: string;
  status: RoadmapStatus | "all";
  category: RoadmapCategoryGroup | "all";
  sort: RoadmapSort;
}

export function useRoadmaps({ search, status, category, sort }: UseRoadmapsParams) {
  const params = {
    limit: ROADMAPS_PAGE_SIZE,
    search: search.trim() || undefined,
    status: status === "all" ? undefined : status,
    category: category === "all" ? undefined : category,
    sort,
  };

  return useInfiniteQuery({
    queryKey: ["roadmaps", params],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => listRoadmaps({ ...params, offset: pageParam }),
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
  });
}
