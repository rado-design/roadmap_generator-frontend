import { createStore } from "../../../shared/lib/createStore";
import { queryClient } from "../../../shared/lib/queryClient";
import { generateRoadmap } from "../api/generateRoadmap";
import type {
  GenerateRoadmapRequest,
  GeneratedRoadmapStep,
  RoadmapGenerationEvent,
} from "../api/generateRoadmap";
import type { RoadmapDetail, RoadmapResource } from "../api/getRoadmapDetail";

export interface RoadmapGenerationStep extends GeneratedRoadmapStep {
  resources: RoadmapResource[];
}

type GenerationStatus = "idle" | "connecting" | "streaming" | "failed" | "complete";

interface RoadmapGenerationState {
  status: GenerationStatus;
  request: GenerateRoadmapRequest | null;
  title?: string;
  steps: RoadmapGenerationStep[];
  attempt: number;
  error?: string;
  started: boolean;
  result?: RoadmapDetail;
  start: (request: GenerateRoadmapRequest) => Promise<RoadmapDetail | undefined>;
  startNew: () => void;
  returnToForm: () => void;
}

const initialGenerationState = {
  status: "idle" as const,
  request: null,
  title: undefined,
  steps: [] as RoadmapGenerationStep[],
  attempt: 1,
  error: undefined,
  started: false,
  result: undefined,
};

export const useRoadmapGenerationStore = createStore<RoadmapGenerationState>(
  "roadmap-generation",
  (set, get) => ({
    ...initialGenerationState,
    start: async (request) => {
      if (get().status === "connecting" || get().status === "streaming") return undefined;

      set({
        ...initialGenerationState,
        status: "connecting",
        request,
      });

      try {
        const roadmap = await generateRoadmap(request, (event: RoadmapGenerationEvent) => {
          switch (event.event) {
            case "meta":
              set({ status: "streaming", started: true, title: event.data.title });
              break;
            case "step":
              set((state) => ({
                status: "streaming",
                started: true,
                steps: [...state.steps, { ...event.data, resources: [] }],
              }));
              break;
            case "resources":
              set((state) => ({
                steps: state.steps.map((step) => step.order === event.data.order
                  ? { ...step, resources: event.data.resources }
                  : step),
              }));
              break;
            case "reset":
              set((state) => ({
                title: undefined,
                steps: [],
                attempt: event.data.attempt,
                started: state.started,
              }));
              break;
            case "error":
              set({ error: event.data.detail });
              break;
            case "done":
              break;
          }
        });

        set({ status: "complete", result: roadmap });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        ]);
        return roadmap;
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : "La génération a échoué. Vérifiez votre connexion puis réessayez.";
        set((state) => state.started
          ? { status: "failed", error: message }
          : { status: "idle", error: message });
        return undefined;
      }
    },
    startNew: () => set((state) => (
      state.status === "connecting" || state.status === "streaming"
        ? state
        : initialGenerationState
    )),
    returnToForm: () => set((state) => ({
      ...initialGenerationState,
      request: state.request,
    })),
  }),
);
