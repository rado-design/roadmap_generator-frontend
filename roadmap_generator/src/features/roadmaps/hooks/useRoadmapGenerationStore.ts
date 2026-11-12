import axios from "axios";
import { createStore } from "../../../shared/lib/createStore";
import { queryClient } from "../../../shared/lib/queryClient";
import {
  generateRoadmap,
  cancelRoadmapGeneration,
  getRoadmapGeneration,
  resumeRoadmapGeneration,
} from "../api/generateRoadmap";
import type {
  GenerateRoadmapRequest,
  GeneratedRoadmapStep,
  RoadmapGenerationEvent,
  RoadmapGenerationSnapshot,
} from "../api/generateRoadmap";
import { getRoadmapDetail, type RoadmapDetail, type RoadmapResource } from "../api/getRoadmapDetail";

export interface RoadmapGenerationStep extends GeneratedRoadmapStep {
  resources: RoadmapResource[] | null;
}

type GenerationStatus = "idle" | "connecting" | "streaming" | "failed" | "complete";

interface RoadmapGenerationState {
  status: GenerationStatus;
  generationId?: string;
  lastEventId: number;
  request: GenerateRoadmapRequest | null;
  title?: string;
  steps: RoadmapGenerationStep[];
  attempt: number;
  error?: string;
  started: boolean;
  result?: RoadmapDetail;
  start: (request: GenerateRoadmapRequest) => Promise<RoadmapDetail | undefined>;
  resume: () => Promise<RoadmapDetail | undefined>;
  cancel: () => Promise<void>;
  startNew: () => void;
  returnToForm: () => void;
}

const STORAGE_KEY = "roadmap-generation-resume-v1";

interface PersistedGeneration {
  generationId?: string;
  lastEventId: number;
  request: GenerateRoadmapRequest | null;
  title?: string;
  steps: RoadmapGenerationStep[];
  attempt: number;
  error?: string;
  started: boolean;
}

function readPersistedGeneration(): PersistedGeneration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<PersistedGeneration>;
    if (!saved.request || typeof saved.request.goal !== "string") return null;
    return {
      generationId: typeof saved.generationId === "string" ? saved.generationId : undefined,
      lastEventId: Number.isSafeInteger(saved.lastEventId) ? Number(saved.lastEventId) : 0,
      request: saved.request,
      title: typeof saved.title === "string" ? saved.title : undefined,
      steps: Array.isArray(saved.steps) ? saved.steps : [],
      attempt: Number.isSafeInteger(saved.attempt) && Number(saved.attempt) > 0 ? Number(saved.attempt) : 1,
      error: typeof saved.error === "string" ? saved.error : undefined,
      started: Boolean(saved.started),
    };
  } catch {
    return null;
  }
}

const persisted = readPersistedGeneration();
const emptyGenerationState = {
  status: "idle" as GenerationStatus,
  generationId: undefined,
  lastEventId: 0,
  request: null,
  title: undefined,
  steps: [] as RoadmapGenerationStep[],
  attempt: 1,
  error: undefined,
  started: false,
  result: undefined,
};
const initialGenerationState = {
  ...emptyGenerationState,
  status: (persisted?.request && persisted.started ? "connecting" : "idle") as GenerationStatus,
  generationId: persisted?.generationId,
  lastEventId: persisted?.lastEventId ?? 0,
  request: persisted?.request ?? null,
  title: persisted?.title,
  steps: persisted?.steps ?? [] as RoadmapGenerationStep[],
  attempt: persisted?.attempt ?? 1,
  error: persisted?.error,
  started: persisted?.started ?? false,
  result: undefined,
};

function isRetryableConnectionError(error: unknown) {
  if (typeof error === "object" && error !== null && "retryable" in error) {
    return Boolean((error as { retryable?: boolean }).retryable);
  }
  if (axios.isAxiosError(error)) {
    return !error.response || error.response.status >= 500 || error.response.status === 429;
  }
  return error instanceof Error
    && error.name === "RoadmapGenerationStreamError"
    && error.message.includes("interrompu");
}

function waitBeforeReconnect(attempt: number) {
  const delay = Math.min(500 * 2 ** Math.min(attempt, 4), 8000);
  return new Promise((resolve) => window.setTimeout(resolve, delay));
}

async function refreshRoadmapQueries() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}

export const useRoadmapGenerationStore = createStore<RoadmapGenerationState>(
  "roadmap-generation",
  (set, get) => {
    let activeRun: Promise<RoadmapDetail | undefined> | null = null;

    const withActiveRun = (runner: () => Promise<RoadmapDetail | undefined>) => {
      if (activeRun) return activeRun;
      activeRun = runner().finally(() => { activeRun = null; });
      return activeRun;
    };

    const applyEvent = (event: RoadmapGenerationEvent, eventId?: number) => {
      set((state) => {
        const cursor = eventId === undefined ? state.lastEventId : Math.max(state.lastEventId, eventId);
        switch (event.event) {
          case "generation":
            return { generationId: event.data.id, lastEventId: cursor, started: true };
          case "meta":
            return { status: "streaming", started: true, title: event.data.title, lastEventId: cursor };
          case "step":
            return {
              status: "streaming",
              started: true,
              lastEventId: cursor,
              steps: [...state.steps, { ...event.data, resources: null }],
            };
          case "resources":
            return {
              lastEventId: cursor,
              steps: state.steps.map((step) => step.order === event.data.order
                ? { ...step, resources: event.data.resources }
                : step),
            };
          case "reset":
            return { title: undefined, steps: [], attempt: event.data.attempt, lastEventId: cursor };
          case "error":
            return { status: "failed", error: event.data.detail, lastEventId: cursor };
          case "cancelled":
            return { ...emptyGenerationState };
          case "done":
            return {
              status: "complete",
              result: event.data,
              title: event.data.title,
              lastEventId: cursor,
            };
        }
      });
    };

    const finishWithRoadmap = async (roadmap: RoadmapDetail) => {
      set({ status: "complete", result: roadmap, title: roadmap.title, error: undefined });
      await refreshRoadmapQueries();
      return roadmap;
    };

    const finishFromSnapshot = async (snapshot: RoadmapGenerationSnapshot) => {
      const restoredSteps: RoadmapGenerationStep[] = snapshot.steps.map((step) => ({ ...step }));
      set({
        generationId: snapshot.id,
        lastEventId: snapshot.last_event_id,
        title: snapshot.title ?? undefined,
        steps: restoredSteps,
        started: true,
        attempt: get().attempt,
      });

      if (snapshot.status === "completed") {
        if (!snapshot.roadmap_id) {
          set({ status: "failed", error: "La génération est terminée, mais sa roadmap est introuvable." });
          return undefined;
        }
        const response = await queryClient.fetchQuery({
          queryKey: ["roadmaps", "detail", snapshot.roadmap_id],
          queryFn: () => getRoadmapDetail(snapshot.roadmap_id!),
        });
        return finishWithRoadmap(response);
      }
      if (snapshot.status === "failed") {
        set({ status: "failed", error: snapshot.error?.detail ?? "La génération n'a pas abouti." });
        return undefined;
      }
      if (snapshot.status === "cancelled") {
        set({ ...emptyGenerationState });
        return undefined;
      }
      set({ status: "streaming", error: undefined });
      return null;
    };

    const followGeneration = async (generationId: string): Promise<RoadmapDetail | undefined> => {
      let reconnectAttempt = 0;
      while (true) {
        try {
          const snapshot = await getRoadmapGeneration(generationId);
          const snapshotResult = await finishFromSnapshot(snapshot);
          if (snapshotResult !== null) return snapshotResult;

          const roadmap = await resumeRoadmapGeneration(
            generationId,
            snapshot.last_event_id,
            applyEvent,
          );
          if (roadmap) return finishWithRoadmap(roadmap);
          const current = get();
          if (current.status === "complete") {
            if (current.result) return finishWithRoadmap(current.result);
            return undefined;
          }
          if (current.status === "failed" || current.status === "idle") return undefined;
          reconnectAttempt = 0;
        } catch (error) {
          if (!isRetryableConnectionError(error)) {
            if (typeof error === "object" && error !== null && "status" in error && error.status === 404) {
              set({ ...emptyGenerationState });
              return undefined;
            }
            const message = error instanceof Error ? error.message : "Impossible de reprendre la génération.";
            set({ status: "failed", generationId: undefined, error: message });
            return undefined;
          }
          set({ status: "connecting" });
        }
        await waitBeforeReconnect(reconnectAttempt++);
      }
    };

    const startOrRecoverGeneration = async (request: GenerateRoadmapRequest): Promise<RoadmapDetail | undefined> => {
      let reconnectAttempt = 0;
      while (true) {
        try {
          const roadmap = await generateRoadmap(request, applyEvent);
          if (roadmap) return finishWithRoadmap(roadmap);
          const current = get();
          if (current.status === "failed" || current.status === "idle") return undefined;
          if (current.generationId) return followGeneration(current.generationId);
          reconnectAttempt++;
        } catch (error) {
          const current = get();
          if (current.generationId) return followGeneration(current.generationId);
          if (!isRetryableConnectionError(error)) {
            const message = error instanceof Error ? error.message : "La génération a échoué. Réessayez.";
            set((state) => ({ status: "failed", error: message, started: state.started }));
            return undefined;
          }
          set({ status: "connecting" });
          reconnectAttempt++;
        }
        await waitBeforeReconnect(reconnectAttempt);
      }
    };

    const resumeCurrent = () => withActiveRun(async () => {
      const current = get();
      if (!current.request || current.status === "idle") return undefined;
      if (current.status === "failed" && !current.generationId) return undefined;
      set({ status: "connecting" });
      return current.generationId
        ? followGeneration(current.generationId)
        : startOrRecoverGeneration(current.request);
    });

    const cancelCurrentGeneration = async () => {
      const generationId = get().generationId;
      if (!generationId) throw new Error("L'identifiant de génération n'est pas encore disponible.");
      await cancelRoadmapGeneration(generationId);
      const snapshot = await getRoadmapGeneration(generationId);
      await finishFromSnapshot(snapshot);
    };

    return {
      ...initialGenerationState,
      start: (request) => {
        const current = get();
        if (activeRun) return activeRun;
        if (current.status === "connecting" || current.status === "streaming") return resumeCurrent();
        set({ ...emptyGenerationState, status: "connecting", request, started: true });
        return withActiveRun(() => startOrRecoverGeneration(request));
      },
      resume: resumeCurrent,
      cancel: cancelCurrentGeneration,
      startNew: () => set((state) => (
        state.status === "connecting" || state.status === "streaming"
          ? state
          : { ...emptyGenerationState }
      )),
      returnToForm: () => set((state) => ({
        ...emptyGenerationState,
        request: state.request,
      })),
    };
  },
);

useRoadmapGenerationStore.subscribe((state) => {
  if (typeof window === "undefined") return;
    const shouldPersist = Boolean(state.request && state.status !== "idle");
  try {
    if (!shouldPersist) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const saved: PersistedGeneration = {
      generationId: state.generationId,
      lastEventId: state.lastEventId,
      request: state.request,
      title: state.title,
      steps: state.steps,
      attempt: state.attempt,
      error: state.error,
      started: state.started,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Sans stockage local, le navigateur ne peut pas retrouver l'identifiant de tâche après actualisation.
  }
});
