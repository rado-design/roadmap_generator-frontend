import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setResourceFavorite } from "../api/setResourceFavorite";
import type { ResourceListResponse } from "../api/listResources";

export function useSetResourceFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, favorite }: { resourceId: number; favorite: boolean }) =>
      setResourceFavorite(resourceId, favorite),
    onMutate: async ({ resourceId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: ["resources"] });
      const previousResources = queryClient.getQueriesData({ queryKey: ["resources"] });
      queryClient.setQueriesData({ queryKey: ["resources"] }, (data: { pages: ResourceListResponse[]; pageParams: unknown[] } | undefined) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((resource) => resource.id === resourceId ? { ...resource, is_favorite: favorite } : resource),
          })),
        };
      });
      return { previousResources };
    },
    onError: (_error, _variables, context) => {
      context?.previousResources.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSettled: async () => queryClient.invalidateQueries({ queryKey: ["resources"] }),
  });
}
