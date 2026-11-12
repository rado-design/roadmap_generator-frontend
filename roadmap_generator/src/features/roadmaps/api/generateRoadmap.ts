import type { AxiosProgressEvent } from "axios";
import { apiClient } from "../../../shared/lib/axios";
import type { RoadmapDetail, RoadmapResource } from "./getRoadmapDetail";

/** Valeur stable fournie par GET /api/v1/categories. */
export type RoadmapCategory = string;
export type LearnerLevel = "none" | "beginner" | "intermediate" | "advanced";

export interface GenerateRoadmapRequest {
  goal: string;
  category: RoadmapCategory;
  level: LearnerLevel;
  weekly_hours: number;
  deadline_weeks: number | null;
  background: string | null;
}

export interface GeneratedRoadmapStep {
  order: number;
  title: string;
  description: string;
  estimated_duration_days: number | null;
  learning_objectives: string[];
}

export interface GenerationStepSnapshot extends GeneratedRoadmapStep {
  resources: RoadmapResource[] | null;
}

export interface RoadmapGenerationSnapshot {
  id: string;
  status: "running" | "completed" | "failed" | "cancelled";
  roadmap_id: number | null;
  error: { type: string; detail: string } | null;
  title: string | null;
  steps: GenerationStepSnapshot[];
  last_event_id: number;
  created_at: string;
  finished_at: string | null;
}

export type RoadmapGenerationEvent =
  | { event: "generation"; data: { id: string } }
  | { event: "meta"; data: { title: string } }
  | { event: "step"; data: GeneratedRoadmapStep }
  | { event: "resources"; data: { order: number; resources: RoadmapResource[] } }
  | { event: "reset"; data: { attempt: number } }
  | { event: "done"; data: RoadmapDetail }
  | { event: "error"; data: { type: string; detail: string } }
  | { event: "cancelled"; data: Record<string, never> };

export class RoadmapGenerationStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoadmapGenerationStreamError";
  }
}

type GenerationEventHandler = (event: RoadmapGenerationEvent, eventId?: number) => void;

interface SseMessage {
  event: string;
  data: string;
  id?: number;
}

function isGenerationInProgressError(error: unknown): error is { status: number; code: string; generation_id: string } {
  return typeof error === "object" && error !== null
    && "status" in error && error.status === 409
    && "code" in error && error.code === "generation_in_progress"
    && "generation_id" in error && typeof error.generation_id === "string";
}

async function consumeGenerationStream(
  request: (onDownloadProgress: (event: AxiosProgressEvent) => void) => Promise<{ data: string }>,
  onEvent: GenerationEventHandler,
) {
  let receivedText = "";
  let buffer = "";
  let eventName = "message";
  let eventId: number | undefined;
  const dataLines: string[] = [];
  let completedRoadmap: RoadmapDetail | undefined;
  let streamError: Error | undefined;
  let terminalEventSeen = false;

  const dispatch = () => {
    if (dataLines.length === 0) {
      eventName = "message";
      eventId = undefined;
      return;
    }
    const message: SseMessage = { event: eventName, data: dataLines.join("\n"), id: eventId };
    eventName = "message";
    eventId = undefined;
    dataLines.length = 0;

    try {
      const data: unknown = JSON.parse(message.data);
      switch (message.event) {
        case "generation": onEvent({ event: "generation", data: data as { id: string } }, message.id); break;
        case "meta": onEvent({ event: "meta", data: data as { title: string } }, message.id); break;
        case "step": onEvent({ event: "step", data: data as GeneratedRoadmapStep }, message.id); break;
        case "resources": onEvent({ event: "resources", data: data as { order: number; resources: RoadmapResource[] } }, message.id); break;
        case "reset": onEvent({ event: "reset", data: data as { attempt: number } }, message.id); break;
        case "done":
          completedRoadmap = data as RoadmapDetail;
          terminalEventSeen = true;
          onEvent({ event: "done", data: completedRoadmap }, message.id);
          break;
        case "error": {
          const errorData = data as { type: string; detail: string };
          terminalEventSeen = true;
          onEvent({ event: "error", data: errorData }, message.id);
          break;
        }
        case "cancelled":
          terminalEventSeen = true;
          onEvent({ event: "cancelled", data: data as Record<string, never> }, message.id);
          break;
        default:
          streamError = new RoadmapGenerationStreamError(`Événement de génération inconnu : ${message.event}`);
      }
    } catch (error) {
      streamError = error instanceof Error ? error : new RoadmapGenerationStreamError("Le flux de génération est invalide.");
    }
  };

  const processLine = (rawLine: string) => {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (!line) { dispatch(); return; }
    if (line.startsWith(":")) return;
    const separator = line.indexOf(":");
    const field = separator < 0 ? line : line.slice(0, separator);
    const value = separator < 0 ? "" : line.slice(separator + 1).replace(/^ /, "");
    if (field === "event") eventName = value;
    if (field === "data") dataLines.push(value);
    if (field === "id") {
      const parsed = Number(value);
      eventId = Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
    }
  };

  const consumeCumulativeText = (text: string) => {
    if (!text.startsWith(receivedText)) {
      streamError = new RoadmapGenerationStreamError("Le flux de génération a été interrompu.");
      return;
    }
    buffer += text.slice(receivedText.length);
    receivedText = text;
    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex >= 0) {
      processLine(buffer.slice(0, newlineIndex));
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf("\n");
    }
  };

  const response = await request(({ event }) => {
    const xhr = event?.target as XMLHttpRequest | null | undefined;
    if (typeof xhr?.responseText === "string") consumeCumulativeText(xhr.responseText);
  });
  if (typeof response.data === "string") consumeCumulativeText(response.data);
  if (buffer) processLine(buffer);
  dispatch();
  if (streamError) throw streamError;
  return { roadmap: completedRoadmap, terminalEventSeen };
}

/** Démarre une génération détachée du flux; en cas de 409, reprend l'identifiant déjà actif. */
export async function generateRoadmap(payload: GenerateRoadmapRequest, onEvent: GenerationEventHandler, signal?: AbortSignal) {
  try {
    return (await consumeGenerationStream(
      (onDownloadProgress) => apiClient.post<string>("api/v1/roadmaps/generate/stream", payload, {
        responseType: "text",
        signal,
        headers: { Accept: "text/event-stream" },
        onDownloadProgress,
      }),
      onEvent,
    )).roadmap;
  } catch (error) {
    if (isGenerationInProgressError(error)) {
      onEvent({ event: "generation", data: { id: error.generation_id } });
      return undefined;
    }
    throw error;
  }
}

export async function resumeRoadmapGeneration(
  generationId: string,
  lastEventId: number,
  onEvent: GenerationEventHandler,
) {
  return (await consumeGenerationStream(
    (onDownloadProgress) => apiClient.get<string>(`api/v1/roadmaps/generations/${generationId}/events`, {
      responseType: "text",
      headers: { Accept: "text/event-stream", "Last-Event-ID": String(lastEventId) },
      onDownloadProgress,
    }),
    onEvent,
  )).roadmap;
}

export async function getRoadmapGeneration(generationId: string) {
  const response = await apiClient.get<RoadmapGenerationSnapshot>(`api/v1/roadmaps/generations/${generationId}`);
  return response.data;
}

export async function cancelRoadmapGeneration(generationId: string) {
  await apiClient.delete(`api/v1/roadmaps/generations/${generationId}`);
}
