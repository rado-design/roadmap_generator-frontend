import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setRoadmapArchived } from "../api/setRoadmapArchived";

export function useSetRoadmapArchived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roadmapId, archived }: { roadmapId: number; archived: boolean }) =>
      setRoadmapArchived(roadmapId, archived),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] }),
      ]);
    },
  });
}
