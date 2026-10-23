import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setResourceFavorite } from "../api/setResourceFavorite";

export function useSetResourceFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, favorite }: { resourceId: number; favorite: boolean }) =>
      setResourceFavorite(resourceId, favorite),
    onSettled: async () => queryClient.invalidateQueries({ queryKey: ["resources"] }),
  });
}
