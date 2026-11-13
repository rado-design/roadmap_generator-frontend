import type { AxiosProgressEvent } from "axios";
import { apiClient } from "../../../shared/lib/axios";
import type { RoadmapDetail, RoadmapResource } from "./getRoadmapDetail";
import type { GeneratedRoadmapStep } from "./generateRoadmap";

export interface RoadmapAdaptPlan {
  locked_step_ids: number[];
  replaced_step_ids: number[];
  first_order: number;
}

export type RoadmapAdaptEvent =
  | { event: "plan"; data: RoadmapAdaptPlan }
  | { event: "step"; data: GeneratedRoadmapStep }
  | { event: "resources"; data: { order: number; resources: RoadmapResource[] } }
  | { event: "reset"; data: { attempt: number } }
  | { event: "done"; data: RoadmapDetail }
  | { event: "error"; data: { type: string; detail: string } };

export class RoadmapAdaptStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoadmapAdaptStreamError";
  }
}

interface SseMessage { event: string; data: string }

export async function adaptRoadmap(
  roadmapId: number,
  instruction: string | undefined,
  onEvent: (event: RoadmapAdaptEvent) => void,
) {
  let receivedText = "";
  let buffer = "";
  let eventName = "message";
  const dataLines: string[] = [];
  let completedRoadmap: RoadmapDetail | undefined;
  let streamError: Error | undefined;

  const dispatch = () => {
    if (!dataLines.length) { eventName = "message"; return; }
    const message: SseMessage = { event: eventName, data: dataLines.join("\n") };
    eventName = "message";
    dataLines.length = 0;
    try {
      const data: unknown = JSON.parse(message.data);
      switch (message.event) {
        case "plan": onEvent({ event: "plan", data: data as RoadmapAdaptPlan }); break;
        case "step": onEvent({ event: "step", data: data as GeneratedRoadmapStep }); break;
        case "resources": onEvent({ event: "resources", data: data as { order: number; resources: RoadmapResource[] } }); break;
        case "reset": onEvent({ event: "reset", data: data as { attempt: number } }); break;
        case "done":
          completedRoadmap = data as RoadmapDetail;
          onEvent({ event: "done", data: completedRoadmap });
          break;
        case "error": {
          const error = data as { type: string; detail: string };
          onEvent({ event: "error", data: error });
          streamError = new RoadmapAdaptStreamError(error.detail);
          break;
        }
        default: streamError = new RoadmapAdaptStreamError(`Événement d’adaptation inconnu : ${message.event}`);
      }
    } catch (error) {
      streamError = error instanceof Error ? error : new RoadmapAdaptStreamError("Le flux d’adaptation est invalide.");
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
  };

  const consumeCumulativeText = (text: string) => {
    if (!text.startsWith(receivedText)) {
      streamError = new RoadmapAdaptStreamError("Le flux d’adaptation a été interrompu.");
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
    `api/v1/roadmaps/${roadmapId}/adapt/stream`,
    instruction ? { instruction } : {},
    { responseType: "text", headers: { Accept: "text/event-stream" }, onDownloadProgress },
  );
  if (typeof response.data === "string") consumeCumulativeText(response.data);
  if (buffer) processLine(buffer);
  dispatch();
  if (streamError) throw streamError;
  if (!completedRoadmap) throw new RoadmapAdaptStreamError("Le flux s’est terminé avant la confirmation de l’adaptation.");
  return completedRoadmap;
}

export async function undoRoadmapAdaptation(roadmapId: number) {
  const response = await apiClient.post<RoadmapDetail>(`api/v1/roadmaps/${roadmapId}/adapt/undo`);
  return response.data;
}

export async function undoAdaptedStep(roadmapId: number, createdStepId: number) {
  const response = await apiClient.post<RoadmapDetail>(
    `api/v1/roadmaps/${roadmapId}/adapt/revisions/latest/steps/${createdStepId}/undo`,
  );
  return response.data;
}
