import type { AxiosProgressEvent } from "axios";
import { apiClient } from "../../../shared/lib/axios";
import type { RoadmapDetail, RoadmapResource } from "./getRoadmapDetail";

export type RoadmapCategory =
  | "programming"
  | "mobile_dev"
  | "marketing_sales"
  | "project_management"
  | "ux_ui_design"
  | "other";
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

export type RoadmapGenerationEvent =
  | { event: "meta"; data: { title: string } }
  | { event: "step"; data: GeneratedRoadmapStep }
  | { event: "resources"; data: { order: number; resources: RoadmapResource[] } }
  | { event: "reset"; data: { attempt: number } }
  | { event: "done"; data: RoadmapDetail }
  | { event: "error"; data: { type: string; detail: string } };

export class RoadmapGenerationStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoadmapGenerationStreamError";
  }
}

interface SseMessage {
  event: string;
  data: string;
}

/** Envoie le questionnaire et consomme les événements SSE au fil de la réponse HTTP. */
export async function generateRoadmap(
  payload: GenerateRoadmapRequest,
  onEvent: (event: RoadmapGenerationEvent) => void,
  signal?: AbortSignal,
) {
  let receivedText = "";
  let buffer = "";
  let eventName = "message";
  const dataLines: string[] = [];
  let completedRoadmap: RoadmapDetail | undefined;
  let streamError: Error | undefined;

  const dispatch = () => {
    if (dataLines.length === 0) {
      eventName = "message";
      return;
    }

    const message: SseMessage = { event: eventName, data: dataLines.join("\n") };
    eventName = "message";
    dataLines.length = 0;

    try {
      const data: unknown = JSON.parse(message.data);
      switch (message.event) {
        case "meta":
          onEvent({ event: "meta", data: data as { title: string } });
          break;
        case "step":
          onEvent({ event: "step", data: data as GeneratedRoadmapStep });
          break;
        case "resources":
          onEvent({ event: "resources", data: data as { order: number; resources: RoadmapResource[] } });
          break;
        case "reset":
          onEvent({ event: "reset", data: data as { attempt: number } });
          break;
        case "done":
          completedRoadmap = data as RoadmapDetail;
          onEvent({ event: "done", data: completedRoadmap });
          break;
        case "error": {
          const errorData = data as { type: string; detail: string };
          onEvent({ event: "error", data: errorData });
          streamError = new RoadmapGenerationStreamError(errorData.detail);
          break;
        }
        default:
          streamError = new RoadmapGenerationStreamError(
            `Événement de génération inconnu : ${message.event}`,
          );
      }
    } catch (error) {
      streamError = error instanceof Error
        ? error
        : new RoadmapGenerationStreamError("Le flux de génération est invalide.");
    }
  };

  const processLine = (rawLine: string) => {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (!line) {
      dispatch();
      return;
    }
    if (line.startsWith(":")) return;

    const separator = line.indexOf(":");
    const field = separator < 0 ? line : line.slice(0, separator);
    const value = separator < 0
      ? ""
      : line.slice(separator + 1).replace(/^ /, "");

    if (field === "event") eventName = value;
    if (field === "data") dataLines.push(value);
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

  const onDownloadProgress = ({ event }: AxiosProgressEvent) => {
    const xhr = event?.target as XMLHttpRequest | null | undefined;
    if (typeof xhr?.responseText === "string") consumeCumulativeText(xhr.responseText);
  };

  const response = await apiClient.post<string>(
    "api/v1/roadmaps/generate/stream",
    payload,
    {
      signal,
      responseType: "text",
      headers: { Accept: "text/event-stream" },
      onDownloadProgress,
    },
  );

  // Consomme le corps complet aussi, au cas où le navigateur n'aurait pas émis
  // de dernier événement de progression avant la résolution de la requête.
  if (typeof response.data === "string") consumeCumulativeText(response.data);
  if (buffer) processLine(buffer);
  dispatch();

  if (streamError) throw streamError;
  if (!completedRoadmap) {
    throw new RoadmapGenerationStreamError(
      "Le flux s'est terminé avant la confirmation de la roadmap.",
    );
  }
  return completedRoadmap;
}
