import { useQuery } from "@tanstack/react-query";
import { getCategoryCatalog } from "../api/getCategoryCatalog";

export function useCategoryCatalog() {
  return useQuery({ queryKey: ["categories"], queryFn: getCategoryCatalog, staleTime: 60 * 60 * 1000 });
}
