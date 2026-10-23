import { useInfiniteQuery } from "@tanstack/react-query";
import { listResources, type ResourceListParams } from "../api/listResources";

export const RESOURCES_PAGE_SIZE = 10;

type ResourceFilters = Omit<ResourceListParams, "offset">;

export function useResources(params: ResourceFilters) {
  return useInfiniteQuery({
    queryKey: ["resources", params],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => listResources({ ...params, offset: pageParam }),
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
  });
}
