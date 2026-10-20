import { useMutation } from "@tanstack/react-query";
import { generateRoadmap } from "../api/generateRoadmap";

export function useGenerateRoadmap() {
  return useMutation({ mutationFn: generateRoadmap });
}
