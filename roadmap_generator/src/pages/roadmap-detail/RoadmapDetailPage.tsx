import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router";
import { AppLayout } from "../../app/layouts";
import {
  useRoadmapDetail,
  useRoadmapLearnerProfile,
  useRoadmapRevisions,
  useProposeStepAdjustment,
  useDecideStepAdjustment,
  useProposeResourceAdjustment,
  useDecideResourceAdjustment,
  useAdaptRoadmap,
  useUndoRoadmapAdaptation,
  useUndoAdaptedStep,
  useSetStepProgress,
  useSetRoadmapArchived,
  type RoadmapDetail,
  type RoadmapResource,
  type RoadmapStep,
  type StepAdjustment,
  type StepContent,
  type ResourceAdjustment,
  type RoadmapAdaptEvent,
  type RoadmapAdaptPlan,
  type GeneratedRoadmapStep,
  type RoadmapRevision,
} from "../../features/roadmaps";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import styles from "./RoadmapDetailPage.module.scss";
import { useStepAdjustmentHistory, useRestoreStepAdjustmentHistory } from "../../features/roadmaps/hooks/useStepAdjustmentHistory";
import type { StepAdjustmentHistoryItem } from "../../features/roadmaps/api/stepAdjustmentHistory";

const roadmapStatusLabels = {
  generating: "Génération en cours",
  ready: "Prête",
  failed: "Échec de génération",
} as const;

const stepStatusLabels = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminée",
} as const;

function StepStatusControl({ value, title, disabled, onChange }: {
  value: RoadmapStep["progress"]["status"];
  title: string;
  disabled: boolean;
  onChange: (value: RoadmapStep["progress"]["status"]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !controlRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className={styles.stepStatusControl} ref={controlRef}>
      <button
        className={`${styles.stepStatus} ${value === "in_progress" ? styles.activeStatus : ""} ${value === "done" ? styles.doneStatus : ""}`}
        type="button"
        aria-label={`Statut de l’étape ${title} : ${stepStatusLabels[value]}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{stepStatusLabels[value]}</span>
        <Icon name="expand_more" />
      </button>
      {isOpen ? (
        <div className={styles.stepStatusMenu} role="menu" aria-label={`Modifier le statut de l’étape ${title}`}>
          {Object.entries(stepStatusLabels).map(([status, label]) => (
            <button
              className={styles.stepStatusOption}
              key={status}
              type="button"
              role="menuitemradio"
              aria-checked={value === status}
              onClick={() => {
                onChange(status as RoadmapStep["progress"]["status"]);
                setIsOpen(false);
              }}
            >
              <span>{label}</span>
              {value === status ? <Icon name="check" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const levelLabels = {
  none: "Non précisé",
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
} as const;

function getProgress(roadmap: RoadmapDetail) {
  if (roadmap.total_steps === 0) return 0;
  return Math.min(100, Math.round((roadmap.completed_steps / roadmap.total_steps) * 100));
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function ResourceIcon({ type }: { type: string }) {
  const normalizedType = type.toLocaleLowerCase("fr");
  const icon = normalizedType.includes("video") ? "play_circle"
    : normalizedType.includes("course") ? "school"
      : normalizedType.includes("doc") || normalizedType.includes("pdf") ? "description"
        : "article";
  return <Icon name={icon} />;
}

function getSafeResourceUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function getVideoEmbedUrl(url: URL) {
  const host = url.hostname.toLocaleLowerCase("fr").replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v")
      ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

function getYouTubeThumbnailUrl(url: URL) {
  const host = url.hostname.toLocaleLowerCase("fr").replace(/^www\./, "");
  const id = host === "youtu.be"
    ? url.pathname.split("/").filter(Boolean)[0]
    : host === "youtube.com" || host === "m.youtube.com"
      ? url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]
      : null;
  return id ? `https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : null;
}

function getResourceTypeLabel(type: string) {
  const normalized = type.toLocaleLowerCase("fr");
  if (normalized.includes("video")) return "Vidéo";
  if (normalized.includes("article")) return "Article";
  if (normalized.includes("course")) return "Cours";
  if (normalized.includes("pdf")) return "PDF";
  if (normalized.includes("doc")) return "Documentation";
  return type;
}

function ResourcePreview({ resource }: { resource: RoadmapResource }) {
  const url = getSafeResourceUrl(resource.url);
  const [previewState, setPreviewState] = useState<"loading" | "ready" | "failed">("loading");
  if (!url) {
    return <ResourceUnavailable resource={resource} />;
  }

  const type = resource.type.toLocaleLowerCase("fr");
  const isVideo = type.includes("video");
  const isDirectVideo = isVideo && /\.(mp4|webm|ogg|m3u8)$/i.test(url.pathname);
  const videoEmbedUrl = isVideo ? getVideoEmbedUrl(url) : null;
  const previewUrl = videoEmbedUrl ?? url.href;

  return (
    <>
      <div className={styles.resourcePreviewStage}>
        {previewState === "loading" ? <ResourceUnavailable resource={resource} loading /> : null}
        {previewState !== "failed" ? isDirectVideo ? (
          <video className={styles.resourceFrame} controls playsInline preload="metadata" onLoadedData={() => setPreviewState("ready")} onError={() => setPreviewState("failed")}>
            <source src={url.href} />
            Votre navigateur ne peut pas lire cette vidéo.
          </video>
        ) : (
          <iframe
            className={styles.resourceFrame}
            src={previewUrl}
            title={`Aperçu : ${resource.title}`}
            loading="lazy"
            allow={isVideo ? "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" : undefined}
            allowFullScreen={isVideo}
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox={isVideo ? "allow-scripts allow-same-origin allow-presentation" : "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"}
            onLoad={() => setPreviewState("ready")}
            onError={() => setPreviewState("failed")}
          />
        ) : <ResourceUnavailable resource={resource} />}
      </div>
      {previewState === "ready" ? <p className={styles.previewHint}>Si le site ne permet pas l’aperçu intégré, ouvrez la ressource dans un nouvel onglet.</p> : null}
    </>
  );
}

function ResourceUnavailable({ resource, loading = false }: { resource: RoadmapResource; loading?: boolean }) {
  const url = getSafeResourceUrl(resource.url);
  const type = getResourceTypeLabel(resource.type);
  return (
    <div className={`${styles.resourceUnavailable} ${loading ? styles.loadingResourceUnavailable : ""}`} role={loading ? "status" : undefined}>
      <span className={styles.resourceUnavailableIcon}><ResourceIcon type={resource.type} /></span>
      <span className={styles.resourceUnavailableType}>{loading ? "Chargement de l’aperçu" : `Aperçu ${type.toLocaleLowerCase("fr")} indisponible`}</span>
      <strong>{resource.title}</strong>
      {url ? <span className={styles.resourceUnavailableHost}>{url.hostname.replace(/^www\./, "")}</span> : null}
      {loading ? <span className={styles.previewLoadingBar} aria-hidden="true" /> : <span className={styles.resourceUnavailableHint}>La ressource reste accessible depuis son site.</span>}
    </div>
  );
}

function ResourceCardPreview({ resource, kind }: { resource: RoadmapResource; kind: "video" | "article" }) {
  const safeUrl = getSafeResourceUrl(resource.url);
  const [previewState, setPreviewState] = useState<"loading" | "ready" | "failed">("loading");
  if (!safeUrl) {
    return <span className={`${styles.stepResourceCover} ${kind === "video" ? styles.videoCover : ""}`} aria-hidden="true"><span className={styles.resourceCoverFallback}><ResourceIcon type={resource.type} /><small>Aperçu indisponible</small></span></span>;
  }

  const isVideo = kind === "video";
  const isDirectVideo = isVideo && /\.(mp4|webm|ogg)$/i.test(safeUrl.pathname);
  const youtubeThumbnail = isVideo ? getYouTubeThumbnailUrl(safeUrl) : null;
  const embedUrl = isVideo ? getVideoEmbedUrl(safeUrl) : safeUrl.href;

  return (
    <span className={`${styles.stepResourceCover} ${isVideo ? styles.videoCover : ""}`} aria-hidden="true">
      {previewState !== "ready" ? <span className={`${styles.resourceCoverFallback} ${previewState === "loading" ? styles.loadingCoverFallback : ""}`}><ResourceIcon type={resource.type} />{previewState === "failed" ? <small>Aperçu indisponible</small> : null}</span> : null}
      {previewState !== "failed" && youtubeThumbnail ? (
        <img className={styles.resourceCardImage} src={youtubeThumbnail} alt="" loading="lazy" onLoad={() => setPreviewState("ready")} onError={() => setPreviewState("failed")} />
      ) : null}
      {previewState !== "failed" && isDirectVideo ? (
        <video className={styles.resourceCardMedia} muted playsInline preload="metadata" onLoadedData={() => setPreviewState("ready")} onError={() => setPreviewState("failed")}>
          <source src={safeUrl.href} />
        </video>
      ) : null}
      {previewState !== "failed" && !youtubeThumbnail && !isDirectVideo ? (
        <iframe
          className={styles.resourceCardMedia}
          src={embedUrl ?? safeUrl.href}
          title={`Aperçu : ${resource.title}`}
          loading="lazy"
          tabIndex={-1}
          sandbox={isVideo ? "allow-scripts allow-same-origin allow-presentation" : "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"}
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setPreviewState("ready")}
          onError={() => setPreviewState("failed")}
        />
      ) : null}
      {previewState === "failed" ? <span className={styles.resourceCoverFallback}><ResourceIcon type={resource.type} /><small>Aperçu indisponible · {safeUrl.hostname.replace(/^www\./, "")}</small></span> : null}
    </span>
  );
}

function ResourceModal({
  step,
  resourceIndex,
  onResourceIndexChange,
  onClose,
}: {
  step: RoadmapStep;
  resourceIndex: number;
  onResourceIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resource = step.resources[resourceIndex];
  const safeUrl = getSafeResourceUrl(resource?.url ?? null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.resourceDialog}
      aria-labelledby="resource-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className={styles.resourceDialogContent}>
        <header className={styles.resourceDialogHeader}>
          <div className={styles.resourceDialogHeading}>
            <p>Ressource {resourceIndex + 1} sur {step.resources.length} · {step.title}</p>
            <h2 id="resource-dialog-title">{resource?.title ?? "Aperçu de la ressource"}</h2>
            {resource ? <span>{getResourceTypeLabel(resource.type)}</span> : null}
          </div>
          <button className={styles.closeResourceDialog} type="button" onClick={onClose} aria-label="Fermer les ressources">
            <Icon name="close" />
          </button>
        </header>

        {resource ? (
          <div className={styles.resourcePreview}>
            <ResourcePreview resource={resource} />
          </div>
        ) : null}

        <footer className={styles.resourceDialogFooter}>
          <div className={styles.resourceNavigation}>
            <Button
              variant="outline"
              icon="arrow_back"
              disabled={resourceIndex === 0}
              onClick={() => onResourceIndexChange(resourceIndex - 1)}
              aria-label="Ressource précédente"
            >
              Précédente
            </Button>
            <span>{resourceIndex + 1} / {step.resources.length}</span>
            <Button
              variant="outline"
              icon="arrow_forward"
              disabled={resourceIndex >= step.resources.length - 1}
              onClick={() => onResourceIndexChange(resourceIndex + 1)}
              aria-label="Ressource suivante"
            >
              Suivante
            </Button>
          </div>
          {safeUrl ? (
            <a className={styles.openResourceLink} href={safeUrl.href} target="_blank" rel="noreferrer">
              Ouvrir la ressource <Icon name="open_in_new" />
            </a>
          ) : null}
        </footer>
      </div>
    </dialog>
  );
}

function StepAdjustmentContent({ content, label }: { content: StepContent; label: string }) {
  return (
    <section className={styles.adjustmentVersion} aria-label={label}>
      <h3>{label}</h3>
      <h4>{content.title}</h4>
      <p>{content.description}</p>
      <p className={styles.adjustmentDuration}>
        {content.estimated_duration_days === null
          ? "Durée non précisée"
          : `${content.estimated_duration_days} jour${content.estimated_duration_days === 1 ? "" : "s"}`}
      </p>
      {content.learning_objectives.length > 0 ? (
        <div>
          <strong>Objectifs</strong>
          <ul>{content.learning_objectives.map((objective, index) => <li key={`${label}-${index}`}>{objective}</li>)}</ul>
        </div>
      ) : null}
      <div>
        <strong>Ressources ({content.resources.length})</strong>
        {content.resources.length > 0 ? (
          <ul>
            {content.resources.map((resource, index) => {
              const url = getSafeResourceUrl(resource.url);
              return <li key={`${label}-resource-${index}`}>{url ? <a href={url.href} target="_blank" rel="noreferrer">{resource.title}</a> : resource.title}</li>;
            })}
          </ul>
        ) : <p className={styles.adjustmentEmpty}>Aucune ressource.</p>}
      </div>
    </section>
  );
}

function getActionError(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    if ("response" in error) {
      const response = error.response as { data?: { detail?: unknown } } | undefined;
      if (typeof response?.data?.detail === "string") return response.data.detail;
    }
    if ("message" in error) return String(error.message);
  }
  return fallback;
}

interface AdjustmentQuotaNotice { used?: number; limit?: number; resetsAt?: string | null }

function getAdjustmentQuotaNotice(error: unknown): AdjustmentQuotaNotice | null {
  if (typeof error !== "object" || error === null) return null;
  const candidate = error as { status?: unknown; code?: unknown; quota?: unknown; used?: unknown; limit?: unknown; resets_at?: unknown };
  if (candidate.status !== 402 || candidate.code !== "quota_exceeded" || candidate.quota !== "adjustments") return null;
  return {
    used: typeof candidate.used === "number" ? candidate.used : undefined,
    limit: typeof candidate.limit === "number" ? candidate.limit : undefined,
    resetsAt: typeof candidate.resets_at === "string" ? candidate.resets_at : null,
  };
}

function AdjustmentQuotaNotice({ quota }: { quota: AdjustmentQuotaNotice }) {
  const resetDate = quota.resetsAt ? new Date(quota.resetsAt) : null;
  const formattedReset = resetDate && !Number.isNaN(resetDate.getTime())
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(resetDate)
    : null;
  return (
    <div className={styles.adjustmentQuotaNotice} role="alert">
      <strong>Votre quota de modifications par l’IA est atteint.</strong>
      {quota.used !== undefined && quota.limit !== undefined ? <p>Vous avez utilisé {quota.used} modification{quota.used > 1 ? "s" : ""} sur {quota.limit} pour cette période.</p> : null}
      <p>{formattedReset ? `Votre quota sera renouvelé le ${formattedReset}.` : "Ce quota ne se renouvelle pas automatiquement."}</p>
      <Link to="/settings">Consulter mes quotas</Link>
    </div>
  );
}

interface AdaptPreviewStep extends GeneratedRoadmapStep { resources: RoadmapResource[] }

function RoadmapAdaptationDialog({ roadmap, onClose, onAdapted }: {
  roadmap: RoadmapDetail;
  onClose: () => void;
  onAdapted: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [instruction, setInstruction] = useState("");
  const [plan, setPlan] = useState<RoadmapAdaptPlan>();
  const [steps, setSteps] = useState<AdaptPreviewStep[]>([]);
  const [attempt, setAttempt] = useState(1);
  const [status, setStatus] = useState<"form" | "running" | "complete" | "failed">("form");
  const [error, setError] = useState<string>();
  const [quotaNotice, setQuotaNotice] = useState<AdjustmentQuotaNotice | null>(null);
  const adaptMutation = useAdaptRoadmap(roadmap.id);
  const isBusy = adaptMutation.isPending;
  const canClose = !isBusy;
  const lockedSteps = plan
    ? roadmap.steps.filter((step) => plan.locked_step_ids.includes(step.id))
    : [];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedInstruction = instruction.trim();
    if (cleanedInstruction && (cleanedInstruction.length < 3 || cleanedInstruction.length > 500)) return;
    setStatus("running");
    setError(undefined);
    setQuotaNotice(null);
    setPlan(undefined);
    setSteps([]);
    setAttempt(1);
    void adaptMutation.mutateAsync({
      instruction: cleanedInstruction || undefined,
      onEvent: (event: RoadmapAdaptEvent) => {
        switch (event.event) {
          case "plan":
            setPlan(event.data);
            break;
          case "step":
            setSteps((current) => [...current, { ...event.data, resources: [] }]);
            break;
          case "resources":
            setSteps((current) => current.map((step) => step.order === event.data.order
              ? { ...step, resources: event.data.resources }
              : step));
            break;
          case "reset":
            setSteps([]);
            setAttempt(event.data.attempt);
            break;
          case "done":
            setStatus("complete");
            break;
          case "error":
            setError(event.data.detail);
            setStatus("failed");
            break;
        }
      },
    }).then(() => {
      onAdapted();
      setStatus("complete");
    }).catch((caught) => {
      const quota = getAdjustmentQuotaNotice(caught);
      if (quota) setQuotaNotice(quota);
      else setError(getActionError(caught, "L’adaptation a échoué. La roadmap n’a pas été modifiée."));
      setStatus("failed");
    });
  };

  const requestClose = () => { if (canClose) onClose(); };

  return (
    <dialog
      ref={dialogRef}
      className={styles.adjustmentDialog}
      aria-labelledby="roadmap-adaptation-title"
      aria-busy={isBusy}
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) requestClose(); }}
    >
      <div className={styles.adjustmentDialogContent}>
        <header className={styles.adjustmentDialogHeader}>
          <div>
            <p>Adaptation de la roadmap</p>
            <h2 id="roadmap-adaptation-title">{roadmap.title}</h2>
          </div>
          {canClose ? (
            <button className={styles.closeResourceDialog} type="button" onClick={onClose} aria-label="Fermer">
              <Icon name="close" />
            </button>
          ) : null}
        </header>

        {status === "form" ? (
          <form className={styles.adjustmentForm} onSubmit={submit}>
            <p>Les étapes « À faire » seront remplacées selon votre progression. Les étapes commencées ou terminées seront conservées. Une copie des étapes remplacées permet d’annuler cette adaptation.</p>
            <label htmlFor="roadmap-adaptation-instruction">Consigne (facultative)</label>
            <textarea
              id="roadmap-adaptation-instruction"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Ex. : ajoute plus de pratique et répartis les étapes sur un rythme plus léger"
            />
            <span className={styles.adjustmentHelper}>
              {instruction.trim() ? `${instruction.trim().length}/500 caractères · 3 minimum` : "Sans consigne, la suite est adaptée à votre progression et à votre profil."}
            </span>
            <footer className={styles.adjustmentActions}>
              <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
              <Button type="submit" icon="auto_awesome" disabled={instruction.trim().length > 0 && instruction.trim().length < 3}>
                Adapter la roadmap
              </Button>
            </footer>
          </form>
        ) : (
          <div className={styles.adaptationProgress}>
            <div className={styles.adaptationSummary} role={status === "failed" ? "alert" : "status"}>
              {status === "running" ? (
                <>
                  <span className={styles.streamPulse} aria-hidden="true" />
                  <div><strong>Adaptation en cours</strong><p>{steps.length} {steps.length === 1 ? "nouvelle étape reçue" : "nouvelles étapes reçues"}{attempt > 1 ? ` · tentative ${attempt}` : ""}</p></div>
                </>
              ) : status === "complete" ? (
                <><Icon name="check_circle" /><div><strong>La roadmap a été adaptée</strong><p>Les étapes commencées et terminées sont conservées.</p></div></>
              ) : (
                <><Icon name="error" /><div><strong>L’adaptation n’a pas abouti</strong><p>{error ?? "La roadmap n’a pas été modifiée."}</p></div></>
              )}
            </div>
            {quotaNotice ? <AdjustmentQuotaNotice quota={quotaNotice} /> : null}
            {plan ? (
              <p className={styles.adaptationPlan}>
                {lockedSteps.length} étape{lockedSteps.length === 1 ? " commencée ou terminée conservée" : "s commencées ou terminées conservées"} · {plan.replaced_step_ids.length} étape{plan.replaced_step_ids.length === 1 ? " remplacée" : "s remplacées"}
              </p>
            ) : null}
            {steps.length ? (
              <ol className={styles.adaptationSteps}>
                {steps.map((step) => (
                  <li key={step.order}>
                    <strong>{step.order}. {step.title}</strong>
                    <p>{step.description}</p>
                    <div className={styles.adaptationStepResources}>
                      <strong>Ressources ({step.resources.length})</strong>
                      {step.resources.length ? (
                        <ul>
                          {step.resources.map((resource, index) => {
                            const url = getSafeResourceUrl(resource.url);
                            return (
                              <li key={`${step.order}-${index}-${resource.title}`}>
                                <span>{resource.title}</span>
                                <small>{getResourceTypeLabel(resource.type)}</small>
                                {url ? <a href={url.href} target="_blank" rel="noreferrer">Ouvrir la ressource <Icon name="open_in_new" /></a> : null}
                              </li>
                            );
                          })}
                        </ul>
                      ) : status === "running" ? (
                        <span className={styles.adaptationResourceWaiting}>Recherche des ressources…</span>
                      ) : (
                        <span className={styles.adaptationResourceWaiting}>Aucune ressource reçue pour cette étape.</span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : status === "running" ? <p className={styles.adaptationWaiting}>En attente de la première étape adaptée…</p> : null}
            {canClose ? (
              <footer className={styles.adjustmentActions}>
                <Button onClick={onClose}>{status === "complete" ? "Terminer" : "Fermer"}</Button>
              </footer>
            ) : null}
          </div>
        )}
      </div>
    </dialog>
  );
}

interface ChangedStepVersion {
  currentStep: RoadmapStep;
  previousStep: RoadmapStep;
  adaptedAt: string;
  canUndo: boolean;
  source: "roadmap" | "individual";
  adjustmentId?: number;
}

function getActiveRevisionHistory(steps: RoadmapStep[], revisions: RoadmapRevision[]) {
  const changes: ChangedStepVersion[] = [];
  const newStepIds: number[] = [];
  const currentIds = new Set(steps.map((step) => Number(step.id)));

  for (const revision of revisions) {
    for (const createdStepId of revision.created_step_ids) {
      if (!currentIds.has(Number(createdStepId))) continue;
      const currentStep = steps.find((step) => Number(step.id) === Number(createdStepId));
      if (!currentStep) continue;

      const link = revision.step_links?.find((item) => Number(item.created_step_id) === Number(createdStepId));
      // Les anciennes révisions peuvent ne pas avoir de liens exploitables; leur historique est associé par position.
      const previous = link
        ? (link.replaced_step_id === null ? undefined : revision.replaced_steps.find((item) => Number(item.id) === Number(link.replaced_step_id)))
        : !revision.step_links?.length
          ? revision.replaced_steps.find((item) => item.order === currentStep.order)
          : undefined;

      if (!previous) {
        if (link?.replaced_step_id === null) newStepIds.push(createdStepId);
        continue;
      }

      const previousStep: RoadmapStep = {
        ...currentStep,
        ...previous,
        id: previous.id ?? currentStep.id,
        progress: currentStep.progress,
      };
      const canUndo = revision.is_latest
        && link?.replaced_step_id != null
        && currentStep.progress.status === "todo";
      const change = getChangedStepVersion(currentStep, previousStep, revision.created_at, canUndo);
      if (change) changes.push({ ...change, source: "roadmap" });
    }
  }

  return { changes, newStepIds };
}

function getChangedStepVersion(currentStep: RoadmapStep, previousStep: RoadmapStep, adaptedAt: string, canUndo: boolean): ChangedStepVersion | null {
  // Une étape liée à un snapshot est issue d'un remplacement, même si le modèle a conservé le même contenu visible.
  // Elle doit donc garder son accès à l'historique et à la restauration ciblée.
  if (previousStep.id !== currentStep.id) {
    return { currentStep, previousStep, adaptedAt, canUndo, source: "roadmap" };
  }

  const contentChanged = currentStep.title !== previousStep.title
    || currentStep.description !== previousStep.description
    || currentStep.estimated_duration_days !== previousStep.estimated_duration_days
    || JSON.stringify(currentStep.learning_objectives) !== JSON.stringify(previousStep.learning_objectives)
    || JSON.stringify(currentStep.resources) !== JSON.stringify(previousStep.resources);
  return contentChanged ? { currentStep, previousStep, adaptedAt, canUndo, source: "roadmap" } : null;
}

function mapIndividualHistoryItem(currentStep: RoadmapStep, item: StepAdjustmentHistoryItem): ChangedStepVersion {
  return {
    currentStep,
    previousStep: { ...currentStep, ...item.previous },
    adaptedAt: item.adapted_at,
    canUndo: item.can_undo,
    source: "individual",
    adjustmentId: item.adjustment_id,
  };
}

function PreviousStepVersionDialog({ changes, adaptedAt, onClose, onRequestRestore, canUndoAdaptation, onRequestUndoAdaptation }: {
  changes: ChangedStepVersion[];
  adaptedAt: string;
  onClose: () => void;
  onRequestRestore: (change: ChangedStepVersion) => void;
  canUndoAdaptation: boolean;
  onRequestUndoAdaptation: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formatAdaptedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(adaptedAt));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.adjustmentDialog}
      aria-labelledby="previous-version-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className={styles.adjustmentDialogContent}>
        <header className={styles.adjustmentDialogHeader}>
          <div>
            <p>Version précédente · adaptation du {formatAdaptedAt}</p>
            <h2 id="previous-version-title">{changes.length === 1 ? "Ancienne version de l’étape" : "Anciennes versions des étapes"}</h2>
          </div>
          <button className={styles.closeResourceDialog} type="button" onClick={onClose} aria-label="Fermer">
            <Icon name="close" />
          </button>
        </header>
        <div className={styles.previousVersionContent}>
          <p className={styles.previousVersionNote}>{changes.length === 1 ? "Cette étape a changé. Voici son ancienne version :" : changes.length > 1 ? `${changes.length} étapes ont changé. Voici uniquement leurs anciennes versions :` : "L’adaptation globale ne contient pas d’ancienne version d’étape consultable."}</p>
          <div className={styles.previousVersionList}>
            {changes.map(({ currentStep, previousStep }) => (
              <StepAdjustmentContent
                key={currentStep.id}
                content={previousStep}
                label={changes.length === 1 ? `Avant · étape ${previousStep.order}` : `Avant · ${currentStep.title}`}
              />
            ))}
          </div>
        </div>
        <footer className={styles.previousVersionFooter}>
          {canUndoAdaptation ? <Button variant="outline" icon="undo" onClick={onRequestUndoAdaptation}>Annuler la dernière adaptation</Button> : null}
          {changes.length === 1 && changes[0].canUndo ? (
            <Button variant="outline" icon="undo" onClick={() => onRequestRestore(changes[0])}>Restaurer cette étape</Button>
          ) : null}
          <Button onClick={onClose}>Fermer</Button>
        </footer>
      </div>
    </dialog>
  );
}

function UndoAdaptationConfirmDialog({ open, isLoading, error, stepTitle, onConfirm, onCancel }: {
  open: boolean;
  isLoading: boolean;
  error?: string;
  stepTitle?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => { if (dialog.open) dialog.close(); };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.undoAdaptationDialog}
      aria-labelledby={`${dialogId}-title`}
      aria-describedby={`${dialogId}-description`}
      aria-busy={isLoading}
      onCancel={(event) => { event.preventDefault(); if (!isLoading) onCancel(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !isLoading) onCancel(); }}
    >
      <div className={styles.undoAdaptationContent}>
        <span className={styles.undoAdaptationIcon} aria-hidden="true"><Icon name="undo" /></span>
        <h2 id={`${dialogId}-title`}>{stepTitle ? "Restaurer l’ancienne version ?" : "Annuler la dernière adaptation ?"}</h2>
        <p id={`${dialogId}-description`}>
          {stepTitle
            ? `Seule l’étape « ${stepTitle} » sera remplacée par sa version précédente. Elle repassera à « à faire » et ses favoris ne seront pas restaurés. Les autres étapes adaptées resteront en place.`
            : "Les étapes créées par l’adaptation seront supprimées et les anciennes étapes seront restaurées. Leurs favoris ne seront pas restaurés. Les nouvelles étapes doivent être « À faire » pour permettre l’annulation."}
        </p>
        {error ? <p className={styles.undoAdaptationError} role="alert">{error}</p> : null}
        <div className={styles.undoAdaptationActions}>
          <Button type="button" variant="outline" disabled={isLoading} onClick={onCancel}>Garder cette version</Button>
          <Button type="button" isLoading={isLoading} disabled={isLoading} onClick={onConfirm}>{stepTitle ? "Restaurer cette étape" : "Annuler l’adaptation"}</Button>
        </div>
      </div>
    </dialog>
  );
}

function StepAdjustmentDialog({ roadmapId, step, onClose }: {
  roadmapId: number;
  step: RoadmapStep;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [instruction, setInstruction] = useState("");
  const proposeMutation = useProposeStepAdjustment(roadmapId);
  const decideMutation = useDecideStepAdjustment(roadmapId);
  const proposal: StepAdjustment | undefined = proposeMutation.data;
  const isBusy = proposeMutation.isPending || decideMutation.isPending;
  const canClose = !isBusy && !proposal;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  const requestClose = () => {
    if (canClose) onClose();
  };

  const submitInstruction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedInstruction = instruction.trim();
    if (cleanedInstruction.length < 3 || cleanedInstruction.length > 500) return;
    void proposeMutation.mutateAsync({ stepId: step.id, instruction: cleanedInstruction }).catch(() => undefined);
  };

  const decide = (decision: "accept" | "reject") => {
    if (!proposal) return;
    void decideMutation.mutateAsync({ stepId: step.id, adjustmentId: proposal.id, decision })
      .then(onClose)
      .catch(() => undefined);
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.adjustmentDialog}
      aria-labelledby="step-adjustment-title"
      aria-busy={isBusy}
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) requestClose(); }}
    >
      <div className={styles.adjustmentDialogContent}>
        <header className={styles.adjustmentDialogHeader}>
          <div>
            <p>Régénération d’étape</p>
            <h2 id="step-adjustment-title">{step.title}</h2>
          </div>
          {canClose ? (
            <button className={styles.closeResourceDialog} type="button" onClick={onClose} aria-label="Fermer">
              <Icon name="close" />
            </button>
          ) : null}
        </header>

        {!proposal ? (
          <form className={styles.adjustmentForm} onSubmit={submitInstruction}>
            <p>Expliquez ce que vous souhaitez changer. L’étape actuelle restera en place tant que vous n’aurez pas accepté la proposition.</p>
            <label htmlFor="step-adjustment-instruction">Votre consigne</label>
            <textarea
              id="step-adjustment-instruction"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              minLength={3}
              maxLength={500}
              rows={4}
              placeholder="Ex. : rends cette étape plus pratique et ajoute un exercice guidé"
              disabled={isBusy}
              required
            />
            <span className={styles.adjustmentHelper}>{instruction.trim().length}/500 caractères · 3 minimum</span>
            {proposeMutation.isError ? (
              getAdjustmentQuotaNotice(proposeMutation.error)
                ? <AdjustmentQuotaNotice quota={getAdjustmentQuotaNotice(proposeMutation.error)!} />
                : <p className={styles.adjustmentError} role="alert">{getActionError(proposeMutation.error, "La proposition n’a pas pu être générée. Réessayez.")}</p>
            ) : null}
            <footer className={styles.adjustmentActions}>
              <Button type="button" variant="outline" disabled={isBusy} onClick={onClose}>Annuler</Button>
              <Button type="submit" icon="auto_awesome" isLoading={proposeMutation.isPending} disabled={instruction.trim().length < 3}>
                Générer une proposition
              </Button>
            </footer>
          </form>
        ) : (
          <div className={styles.adjustmentProposal}>
            <p className={styles.adjustmentInstruction}><strong>Votre consigne :</strong> {proposal.instruction}</p>
            <div className={styles.adjustmentComparison}>
              <StepAdjustmentContent content={proposal.current} label="Étape actuelle" />
              <StepAdjustmentContent content={proposal.proposed} label="Proposition" />
            </div>
            {decideMutation.isError ? (
              <p className={styles.adjustmentError} role="alert">
                {getActionError(decideMutation.error, "Votre choix n’a pas pu être enregistré. Réessayez.")}
              </p>
            ) : null}
            <footer className={styles.adjustmentActions}>
              <Button type="button" variant="outline" isLoading={decideMutation.isPending && decideMutation.variables?.decision === "reject"} disabled={isBusy} onClick={() => decide("reject")}>
                Garder l’étape actuelle
              </Button>
              <Button type="button" icon="check" isLoading={decideMutation.isPending && decideMutation.variables?.decision === "accept"} disabled={isBusy} onClick={() => decide("accept")}>
                Appliquer la proposition
              </Button>
            </footer>
          </div>
        )}
      </div>
    </dialog>
  );
}

function ResourceAdjustmentContent({ resources, label }: {
  resources: RoadmapResource[];
  label: string;
}) {
  return (
    <section className={styles.adjustmentVersion} aria-label={label}>
      <h3>{label}</h3>
      <strong>Ressources ({resources.length})</strong>
      {resources.length > 0 ? (
        <ul>
          {resources.map((resource, index) => {
            const url = getSafeResourceUrl(resource.url);
            return (
              <li key={`${label}-${resource.title}-${index}`}>
                <strong>{resource.title}</strong>
                <span className={styles.adjustmentResourceType}>{getResourceTypeLabel(resource.type)}</span>
                {url ? <a href={url.href} target="_blank" rel="noreferrer">Ouvrir la ressource</a> : null}
              </li>
            );
          })}
        </ul>
      ) : <p className={styles.adjustmentEmpty}>Aucune ressource.</p>}
    </section>
  );
}

function ResourceAdjustmentDialog({ roadmapId, step, onClose }: {
  roadmapId: number;
  step: RoadmapStep;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [instruction, setInstruction] = useState("");
  const proposeMutation = useProposeResourceAdjustment(roadmapId);
  const decideMutation = useDecideResourceAdjustment(roadmapId);
  const proposal: ResourceAdjustment | undefined = proposeMutation.data;
  const isBusy = proposeMutation.isPending || decideMutation.isPending;
  const canClose = !isBusy && !proposal;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  const requestClose = () => {
    if (canClose) onClose();
  };

  const submitInstruction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedInstruction = instruction.trim();
    if (cleanedInstruction.length > 0 && cleanedInstruction.length < 3) return;
    if (cleanedInstruction.length > 500) return;
    void proposeMutation.mutateAsync({
      stepId: step.id,
      instruction: cleanedInstruction || undefined,
    }).catch(() => undefined);
  };

  const decide = (decision: "accept" | "reject") => {
    if (!proposal) return;
    void decideMutation.mutateAsync({ stepId: step.id, adjustmentId: proposal.id, decision })
      .then(onClose)
      .catch(() => undefined);
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.adjustmentDialog}
      aria-labelledby="resource-adjustment-title"
      aria-busy={isBusy}
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) requestClose(); }}
    >
      <div className={styles.adjustmentDialogContent}>
        <header className={styles.adjustmentDialogHeader}>
          <div>
            <p>Régénération des ressources</p>
            <h2 id="resource-adjustment-title">{step.title}</h2>
          </div>
          {canClose ? (
            <button className={styles.closeResourceDialog} type="button" onClick={onClose} aria-label="Fermer">
              <Icon name="close" />
            </button>
          ) : null}
        </header>

        {!proposal ? (
          <form className={styles.adjustmentForm} onSubmit={submitInstruction}>
            <p>Actualisez les ressources de cette étape, ou précisez le type de contenu recherché. Les ressources actuelles resteront en place tant que vous n’aurez pas accepté la proposition.</p>
            <label htmlFor="resource-adjustment-instruction">Consigne (facultative)</label>
            <textarea
              id="resource-adjustment-instruction"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              minLength={instruction.trim().length > 0 ? 3 : undefined}
              maxLength={500}
              rows={4}
              placeholder="Ex. : privilégie des vidéos courtes pour débutants"
              disabled={isBusy}
            />
            <span className={styles.adjustmentHelper}>
              {instruction.trim().length === 0
                ? "Sans consigne, les ressources sont actualisées selon le profil d’apprenant."
                : `${instruction.trim().length}/500 caractères · 3 minimum`}
            </span>
            {proposeMutation.isError ? (
              getAdjustmentQuotaNotice(proposeMutation.error)
                ? <AdjustmentQuotaNotice quota={getAdjustmentQuotaNotice(proposeMutation.error)!} />
                : <p className={styles.adjustmentError} role="alert">{getActionError(proposeMutation.error, "Les ressources n’ont pas pu être générées. Réessayez.")}</p>
            ) : null}
            <footer className={styles.adjustmentActions}>
              <Button type="button" variant="outline" disabled={isBusy} onClick={onClose}>Annuler</Button>
              <Button
                type="submit"
                icon="auto_awesome"
                isLoading={proposeMutation.isPending}
                disabled={isBusy || (instruction.trim().length > 0 && instruction.trim().length < 3)}
              >
                {instruction.trim() ? "Générer une proposition" : "Actualiser les ressources"}
              </Button>
            </footer>
          </form>
        ) : (
          <div className={styles.adjustmentProposal}>
            <p className={styles.adjustmentInstruction}>
              <strong>Consigne :</strong> {proposal.instruction || "Actualisation automatique selon le profil et le sujet de l’étape."}
            </p>
            <div className={styles.adjustmentComparison}>
              <ResourceAdjustmentContent resources={proposal.current} label="Ressources actuelles" />
              <ResourceAdjustmentContent resources={proposal.proposed} label="Proposition" />
            </div>
            {decideMutation.isError ? (
              <p className={styles.adjustmentError} role="alert">
                {getActionError(decideMutation.error, "Votre choix n’a pas pu être enregistré. Réessayez.")}
              </p>
            ) : null}
            <footer className={styles.adjustmentActions}>
              <Button type="button" variant="outline" isLoading={decideMutation.isPending && decideMutation.variables?.decision === "reject"} disabled={isBusy} onClick={() => decide("reject")}>
                Garder les ressources actuelles
              </Button>
              <Button type="button" icon="check" isLoading={decideMutation.isPending && decideMutation.variables?.decision === "accept"} disabled={isBusy} onClick={() => decide("accept")}>
                Remplacer les ressources
              </Button>
            </footer>
          </div>
        )}
      </div>
    </dialog>
  );
}

function StepCard({
  roadmapId,
  step,
  stepNumber,
  isNextStep,
  previousVersion,
  isNewFromAdaptation,
  onViewPreviousVersion,
  isUpdating,
  onProgressChange,
  onOpenResources,
  onAdjustStep,
  onAdjustResources,
  allowAdjustment,
}: {
  roadmapId: number;
  step: RoadmapStep;
  stepNumber: number;
  isNextStep: boolean;
  previousVersion?: ChangedStepVersion;
  isNewFromAdaptation: boolean;
  onViewPreviousVersion: (change: ChangedStepVersion) => void;
  isUpdating: boolean;
  onProgressChange: (stepId: number, status: RoadmapStep["progress"]["status"]) => void;
  onOpenResources: (stepId: number, index: number) => void;
  onAdjustStep: (step: RoadmapStep) => void;
  onAdjustResources: (step: RoadmapStep) => void;
  allowAdjustment: boolean;
}) {
  const [resourcesExpanded, setResourcesExpanded] = useState(true);
  const objectiveStorageKey = `roadmap-objective-progress:${roadmapId}:${step.id}`;
  const [completedObjectives, setCompletedObjectives] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(objectiveStorageKey);
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) && parsed.every((key) => typeof key === "string") ? parsed as string[] : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(objectiveStorageKey, JSON.stringify(completedObjectives));
    } catch {
      // La progression reste disponible en mémoire si le stockage local est indisponible.
    }
  }, [completedObjectives, objectiveStorageKey]);
  const adjustmentHistoryQuery = useStepAdjustmentHistory(roadmapId, step.id);
  const individualHistoryItem = adjustmentHistoryQuery.data?.items.find((item) => item.restored_at === null);
  const individualVersion = individualHistoryItem ? mapIndividualHistoryItem(step, individualHistoryItem) : undefined;
  const activePreviousVersion = individualVersion && (!previousVersion || Date.parse(individualVersion.adaptedAt) >= Date.parse(previousVersion.adaptedAt))
    ? individualVersion
    : previousVersion;
  const isDone = step.progress.status === "done";
  const isActive = step.progress.status === "in_progress";

  return (
    <article id={`step-${step.id}`} className={`${styles.timelineStep} ${isActive ? styles.activeStep : ""}`}>
      <span className={`${styles.timelineMarker} ${isDone ? styles.completedMarker : isActive || isNextStep ? styles.activeMarker : styles.upcomingMarker}`} aria-hidden="true">
        {isDone ? <Icon name="check" /> : stepNumber}
      </span>
      <div className={styles.stepBody}>
        <div className={styles.stepHeading}>
          <div className={styles.stepHeadingCopy}>
            <p className={styles.stepEyebrow}>Étape {stepNumber}{isNextStep ? " · Prochaine étape" : ""}</p>
            <h3 className={`${styles.stepTitle} ${isDone ? styles.completedTitle : ""}`}>{step.title}</h3>
          </div>
          <StepStatusControl
            value={step.progress.status}
            title={step.title}
            disabled={isUpdating}
            onChange={(status) => onProgressChange(step.id, status)}
          />
        </div>
        {activePreviousVersion ? (
          <span className={styles.adaptedStepHistory}>
            <Icon name="history" />
            Modifiée
          </span>
        ) : null}
        {isNewFromAdaptation ? <span className={styles.adaptedStepHistory}>Nouvelle étape · ajoutée lors d’une adaptation</span> : null}
        <div className={styles.stepActions}>
          {activePreviousVersion ? (
            <Button className={styles.stepResourcesButton} variant="outline" icon="history" type="button" onClick={() => onViewPreviousVersion(activePreviousVersion)}>
              Voir l’historique
            </Button>
          ) : null}
          {allowAdjustment && step.progress.status === "todo" ? (
            <Button className={styles.stepResourcesButton} variant="outline" icon="auto_awesome" type="button" disabled={isUpdating} onClick={() => onAdjustStep(step)}>
              Régénérer l’étape
            </Button>
          ) : null}
          {allowAdjustment ? (
            <Button className={styles.stepResourcesButton} variant="outline" icon="refresh" type="button" disabled={isUpdating} onClick={() => onAdjustResources(step)}>
              Régénérer les ressources
            </Button>
          ) : null}
          {allowAdjustment && step.progress.status !== "todo" ? <p className={styles.noStepResources}>Remettez l’étape « À faire » pour régénérer son contenu.</p> : null}
        </div>
        <p className={styles.stepDescription}>{step.description}</p>
        {step.learning_objectives.length > 0 ? (
          <section className={styles.objectivesSection} aria-label="Objectifs de l’étape">
            <div className={styles.objectivesHeading}>
              <h4>Objectifs de l’étape</h4>
              <span>{completedObjectives.filter((key) => step.learning_objectives.some((objective, index) => key === `${index}:${objective}`)).length} / {step.learning_objectives.length} terminés</span>
            </div>
            <div className={styles.objectivesProgressTrack} role="progressbar" aria-label={`Progression des objectifs de l’étape ${stepNumber}`} aria-valuemin={0} aria-valuemax={step.learning_objectives.length} aria-valuenow={step.learning_objectives.filter((objective, index) => completedObjectives.includes(`${index}:${objective}`)).length}>
              <span style={{ width: `${step.learning_objectives.length ? step.learning_objectives.filter((objective, index) => completedObjectives.includes(`${index}:${objective}`)).length / step.learning_objectives.length * 100 : 0}%` }} />
            </div>
            <ul className={styles.objectives}>
              {step.learning_objectives.map((objective, index) => {
                const objectiveKey = `${index}:${objective}`;
                const checked = completedObjectives.includes(objectiveKey);
                return (
                  <li key={`${step.id}-${index}`} className={checked ? styles.objectiveCompleted : ""}>
                    <input className={styles.objectiveCheckbox} type="checkbox" checked={checked} onChange={() => setCompletedObjectives((current) => checked ? current.filter((key) => key !== objectiveKey) : [...current, objectiveKey])} aria-label={`Objectif terminé : ${objective}`} />
                    <span>{objective}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        {step.resources.length > 0 ? (
          <section className={styles.stepResourcesSection} aria-label={`Ressources de l'étape ${step.title}`}>
            <button className={styles.resourcesToggle} type="button" aria-expanded={resourcesExpanded} onClick={() => setResourcesExpanded((expanded) => !expanded)}>
              <span><Icon name="assignment_turned_in" />Ressources ({step.resources.length})</span>
              <Icon name={resourcesExpanded ? "expand_less" : "expand_more"} />
            </button>
            {resourcesExpanded ? <>
            <p className={styles.resourcesIntro}><Icon name="lightbulb" />Commencez par ces ressources pour bien avancer sur cette étape.</p>
            <div className={styles.stepResources}>
            {step.resources.map((resource, index) => {
              const type = getResourceTypeLabel(resource.type);
              const kind = type === "Vidéo" ? "video" : "article";
              const resourceUrl = getSafeResourceUrl(resource.url);
              return (
                <article className={styles.stepResourceCard} key={`${step.id}-${index}-${resource.title}`}>
                  <ResourceCardPreview resource={resource} kind={kind} />
                  <span className={styles.stepResourceContent}>
                    <span className={styles.resourceTypePill}>{type.toLocaleLowerCase("fr")}</span>
                    <strong>{resource.title}</strong>
                    <div className={styles.stepResourceActions}>
                      {resourceUrl ? <a className={styles.stepResourceDirectLink} href={resourceUrl.href} target="_blank" rel="noreferrer">Ouvrir<Icon name="open_in_new" /></a> : <button className={styles.stepResourceDirectLink} type="button" onClick={() => onOpenResources(step.id, index)}>Ouvrir<Icon name="arrow_forward" /></button>}
                      <button className={styles.stepResourcePreviewButton} type="button" aria-label={`Voir l’aperçu de « ${resource.title} »`} onClick={() => onOpenResources(step.id, index)}><Icon name="visibility" /></button>
                    </div>
                  </span>
                </article>
              );
            })}
            </div>
            </> : null}
          </section>
        ) : <p className={styles.noStepResources}>Aucune ressource liée à cette étape.</p>}
      </div>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className={styles.skeletonPage} aria-label="Chargement de la roadmap" aria-busy="true">
      <div className={styles.skeletonSummary} />
      <div className={styles.skeletonColumns}>
        <div className={styles.skeletonSteps}><span /><span /><span /></div>
        <div className={styles.skeletonAside}><span /><span /></div>
      </div>
    </div>
  );
}

export function RoadmapDetailPage() {
  const location = useLocation();
  const navigationState = location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null;
  const origin = navigationState?.from;
  const returnToDashboard = origin?.pathname === "/dashboard";
  const returnToRoadmaps = origin?.pathname === "/roadmaps";
  const returnToGenerator = origin?.pathname === "/roadmaps/generate";
  const returnPath = returnToDashboard
    ? `/dashboard${origin?.search ?? ""}${origin?.hash ?? ""}`
    : returnToRoadmaps
      ? `/roadmaps${origin?.search ?? ""}${origin?.hash ?? ""}`
      : returnToGenerator
        ? "/roadmaps/generate"
      : "/roadmaps";
  const returnLabel = returnToDashboard
    ? "Retour au tableau de bord"
    : returnToGenerator
      ? "Retour au formulaire de génération"
      : "Retour à toutes les roadmaps";
  const { roadmapId: routeId } = useParams();
  const parsedId = Number(routeId);
  const roadmapId = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : null;
  const { data, isLoading, isError, error, refetch, isFetching } = useRoadmapDetail(roadmapId);
  const learnerProfileQuery = useRoadmapLearnerProfile(roadmapId);
  const revisionsQuery = useRoadmapRevisions(roadmapId);
  const progressMutation = useSetStepProgress(roadmapId);
  const archiveMutation = useSetRoadmapArchived();
  const undoAdaptationMutation = useUndoRoadmapAdaptation(roadmapId ?? 0);
  const undoAdaptedStepMutation = useUndoAdaptedStep(roadmapId ?? 0);
  const restoreStepAdjustmentMutation = useRestoreStepAdjustmentHistory(roadmapId ?? 0);
  const [resourceViewer, setResourceViewer] = useState<{ stepId: number; index: number } | null>(null);
  const [adjustmentStep, setAdjustmentStep] = useState<RoadmapStep | null>(null);
  const [resourceAdjustmentStep, setResourceAdjustmentStep] = useState<RoadmapStep | null>(null);
  const [adaptRoadmapOpen, setAdaptRoadmapOpen] = useState(false);
  const [historyChangesToShow, setHistoryChangesToShow] = useState<ChangedStepVersion[] | null>(null);
  const [historyOpenedFromJourney, setHistoryOpenedFromJourney] = useState(false);
  const [undoConfirmOpen, setUndoConfirmOpen] = useState(false);
  const [stepUndoTarget, setStepUndoTarget] = useState<ChangedStepVersion | null>(null);
  const orderedSteps = useMemo(
    () => [...(data?.steps ?? [])].sort((left, right) => left.order - right.order),
    [data?.steps],
  );
  const revisionHistory = useMemo(
    () => getActiveRevisionHistory(data?.steps ?? [], revisionsQuery.data?.items ?? []),
    [data?.steps, revisionsQuery.data?.items],
  );
  const changedStepVersions = revisionHistory.changes;
  const adaptedNewStepIds = revisionHistory.newStepIds;
  const hasAdaptationHistory = (revisionsQuery.data?.items.length ?? 0) > 0;

  useEffect(() => {
    if (!data || !location.hash) return;
    const targetId = decodeURIComponent(location.hash.slice(1));
    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [data, location.hash]);
  const completedSteps = orderedSteps.filter((step) => step.progress.status === "done");
  const nextStepId = orderedSteps.find((step) => step.progress.status === "in_progress")?.id
    ?? orderedSteps.find((step) => step.progress.status === "todo")?.id;
  const activeRoadmapStatus = data ? roadmapStatusLabels[data.status] : "";
  const progress = data ? getProgress(data) : 0;
  const resourceCount = orderedSteps.reduce((total, step) => total + step.resources.length, 0);
  const resourceStep = resourceViewer
    ? orderedSteps.find((step) => step.id === resourceViewer.stepId)
    : undefined;
  const httpStatus = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;
  const problemDetail = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
    : undefined;
  const errorMessage = httpStatus === 404
    ? "Cette roadmap est introuvable ou ne vous est pas accessible."
    : typeof problemDetail === "string"
      ? problemDetail
      : "Impossible de charger cette roadmap. Vérifiez votre connexion puis réessayez.";
  const progressError = typeof progressMutation.error === "object" && progressMutation.error !== null && "message" in progressMutation.error
    ? String(progressMutation.error.message)
    : "La progression n'a pas pu être enregistrée. Votre état précédent a été restauré; réessayez.";
  const archiveError = archiveMutation.isError
    ? getActionError(archiveMutation.error, "L’archivage de cette roadmap n’a pas pu être modifié.")
    : undefined;
  const adaptationUndoError = undoAdaptationMutation.isError
    ? getActionError(undoAdaptationMutation.error, "La dernière adaptation n’a pas pu être annulée.")
    : undefined;
  const adaptedStepUndoError = undoAdaptedStepMutation.isError
    ? getActionError(undoAdaptedStepMutation.error, "L’ancienne version de cette étape n’a pas pu être restaurée.")
    : restoreStepAdjustmentMutation.isError
      ? getActionError(restoreStepAdjustmentMutation.error, "L’ancienne version de cette étape n’a pas pu être restaurée.")
      : undefined;

  const updateProgress = (stepId: number, status: RoadmapStep["progress"]["status"]) => {
    progressMutation.mutate({ roadmapId: roadmapId!, stepId, status });
  };
  const openStepResources = (stepId: number, index = 0) => setResourceViewer({ stepId, index });
  const changeResourceIndex = (index: number) => setResourceViewer((current) => current ? { ...current, index } : current);
  const closeResourceViewer = useCallback(() => setResourceViewer(null), []);
  const refreshAdaptationHistory = () => void revisionsQuery.refetch();
  const openUndoConfirmation = () => {
    undoAdaptationMutation.reset();
    setUndoConfirmOpen(true);
  };
  const openJourneyHistory = () => {
    setHistoryOpenedFromJourney(true);
    setHistoryChangesToShow(changedStepVersions);
  };
  const openStepUndoConfirmation = (change: ChangedStepVersion) => {
    undoAdaptedStepMutation.reset();
    restoreStepAdjustmentMutation.reset();
    setHistoryChangesToShow(null);
    setStepUndoTarget(change);
  };
  const confirmUndoAdaptation = () => {
    if (roadmapId === null) return;
    if (stepUndoTarget) {
      const restore = stepUndoTarget.source === "individual" && stepUndoTarget.adjustmentId
        ? restoreStepAdjustmentMutation.mutateAsync({ stepId: stepUndoTarget.currentStep.id, adjustmentId: stepUndoTarget.adjustmentId })
        : undoAdaptedStepMutation.mutateAsync(stepUndoTarget.currentStep.id);
      void restore.then(() => {
        setStepUndoTarget(null);
      }).catch(() => undefined);
      return;
    }
    void undoAdaptationMutation.mutateAsync().then(() => {
      setUndoConfirmOpen(false);
    }).catch(() => undefined);
  };

  return (
    <AppLayout contentClassName={styles.layoutContent}>
      <div className={styles.detailPage}>
      {roadmapId !== null && (isLoading || (!isError && data)) ? (
        <Link className={styles.backButton} to={returnPath}>
          <Icon name="arrow_back" />
          {returnLabel}
        </Link>
      ) : null}
      {roadmapId === null ? (
        <section className={styles.statePanel} role="alert">
          <Icon name="search_off" />
          <h1>Identifiant de roadmap invalide</h1>
          <p>Choisissez une roadmap dans votre liste pour consulter son détail.</p>
          <Link to={returnPath}>{returnLabel}</Link>
        </section>
      ) : null}
      {isLoading ? <DetailSkeleton /> : null}
      {!isLoading && isError ? (
        <section className={styles.statePanel} role="alert">
          <Icon name={httpStatus === 404 ? "search_off" : "cloud_off"} />
          <h1>{httpStatus === 404 ? "Roadmap introuvable" : "Chargement impossible"}</h1>
          <p>{errorMessage}</p>
          {roadmapId !== null ? (
            <Button variant="outline" onClick={() => void refetch()} isLoading={isFetching}>Réessayer</Button>
          ) : null}
          <Link to={returnPath}>{returnLabel}</Link>
        </section>
      ) : null}
      {!isLoading && !isError && data ? (
        <>
          <header className={styles.pageHeading}>
            <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
              <Link to="/roadmaps">Mes roadmaps</Link>
              <Icon name="chevron_right" />
              <span aria-current="page">{data.title}</span>
            </nav>
            <div className={styles.summaryHeading}>
              <div className={styles.summaryCopy}>
                <h1 id="roadmap-title">{data.title}</h1>
              </div>
              <span className={`${styles.roadmapStatus} ${styles[data.status]}`}>{activeRoadmapStatus}</span>
            </div>
          </header>

          {data.archived_at ? (
            <div className={styles.archivedNotice} role="status">
              <Icon name="archive" />
              <span>Cette roadmap est archivée et consultable en lecture seule. Désarchivez-la depuis les actions ci-dessous pour modifier sa progression.</span>
            </div>
          ) : null}

          {progressMutation.isError ? (
            <div className={styles.progressError} role="alert">
              <Icon name="error" />
              <span>{progressError}</span>
            </div>
          ) : null}

          <div className={styles.roadmapLayout}>
            <aside className={styles.journeyCard} aria-labelledby="journey-title">
              <span className={styles.journeyLabel}>Parcours</span>
              <h2 id="journey-title">Votre progression</h2>
              <p className={styles.journeyGoal}>Objectif : {data.goal}</p>
              <div className={styles.journeyProgressCopy}><span>{completedSteps.length} / {orderedSteps.length} étapes terminées</span><strong>{progress} %</strong></div>
              <div className={styles.progressTrack} role="progressbar" aria-label="Progression de la roadmap" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <dl className={styles.journeyStats}>
                <div><Icon name="trending_up" /><dt>Niveau</dt><dd>{learnerProfileQuery.data ? levelLabels[learnerProfileQuery.data.level] : "—"}</dd></div>
                <div><Icon name="route" /><dt>Étapes</dt><dd>{orderedSteps.length}</dd></div>
                <div><Icon name="assignment" /><dt>Ressources</dt><dd>{resourceCount}</dd></div>
                <div><Icon name="calendar_month" /><dt>Créée le</dt><dd>{formatDate(data.created_at)}</dd></div>
              </dl>
              <Button
                className={styles.archiveIconButton}
                variant="outline"
                icon={data.archived_at ? "unarchive" : "archive"}
                title={data.archived_at ? "Désarchiver la roadmap" : "Archiver la roadmap"}
                aria-label={data.archived_at ? "Désarchiver la roadmap" : "Archiver la roadmap"}
                isLoading={archiveMutation.isPending}
                disabled={archiveMutation.isPending}
                onClick={() => { if (roadmapId !== null) archiveMutation.mutate({ roadmapId, archived: !data.archived_at }); }}
              />
              <div className={styles.journeyActions}>
                <Button
                  variant="outline"
                  icon="history"
                  disabled={revisionsQuery.isLoading || (changedStepVersions.length === 0 && !hasAdaptationHistory)}
                  title={changedStepVersions.length === 0 && !hasAdaptationHistory ? "Aucun historique n’est disponible." : undefined}
                  onClick={openJourneyHistory}
                >
                  {revisionsQuery.isLoading ? "Chargement de l’historique…" : `Historique (${changedStepVersions.length})`}
                </Button>
                {revisionsQuery.isError ? (
                  <div className={styles.revisionsError} role="alert">
                    <span>L’historique des adaptations est momentanément indisponible.</span>
                    <Button type="button" variant="outline" icon="refresh" isLoading={revisionsQuery.isFetching} onClick={() => void revisionsQuery.refetch()}>Réessayer</Button>
                  </div>
                ) : null}
                {!data.archived_at ? (
                  <>
                  <Button className={styles.adaptButton} icon="auto_awesome" disabled={!orderedSteps.some((step) => step.progress.status === "todo")} onClick={() => setAdaptRoadmapOpen(true)}>Adapter la suite</Button>
                  {adaptationUndoError ? <p className={styles.adaptationUndoError} role="alert">{adaptationUndoError}</p> : null}
                  </>
                ) : null}
                {archiveError ? <p className={styles.adaptationUndoError} role="alert">{archiveError}</p> : null}
              </div>
            </aside>

            <section className={styles.timelinePanel} aria-label="Étapes de la roadmap">
              {orderedSteps.length > 0 ? (
                <ol className={styles.timelineList}>
                  {orderedSteps.map((step, index) => (
                    <li className={`${styles.timelineListItem} ${step.progress.status === "done" ? styles.completedTimelineItem : step.id === nextStepId ? styles.currentTimelineItem : styles.upcomingTimelineItem}`} key={`${roadmapId}-${step.id}`}>
                      <StepCard roadmapId={roadmapId ?? 0} step={step} stepNumber={index + 1} isNextStep={step.id === nextStepId} previousVersion={changedStepVersions.find((change) => change.currentStep.id === step.id)} isNewFromAdaptation={adaptedNewStepIds.includes(step.id)} onViewPreviousVersion={(change) => setHistoryChangesToShow([change])} isUpdating={progressMutation.isPending || Boolean(data.archived_at)} allowAdjustment={!data.archived_at} onProgressChange={updateProgress} onOpenResources={openStepResources} onAdjustStep={setAdjustmentStep} onAdjustResources={setResourceAdjustmentStep} />
                    </li>
                  ))}
                </ol>
              ) : <div className={styles.noSteps}><Icon name="route" /><p>Aucune étape n'est encore disponible pour cette roadmap.</p></div>}
              {orderedSteps.length > 0 && completedSteps.length === orderedSteps.length ? <p className={styles.completionMessage}>Toutes les étapes de cette roadmap sont terminées.</p> : null}
            </section>
          </div>
          {resourceStep && resourceViewer ? (
            <ResourceModal
              key={resourceStep.id}
              step={resourceStep}
              resourceIndex={resourceViewer.index}
              onResourceIndexChange={changeResourceIndex}
              onClose={closeResourceViewer}
            />
          ) : null}
          {roadmapId !== null && adjustmentStep ? (
            <StepAdjustmentDialog
              key={adjustmentStep.id}
              roadmapId={roadmapId}
              step={adjustmentStep}
              onClose={() => setAdjustmentStep(null)}
            />
          ) : null}
          {roadmapId !== null && resourceAdjustmentStep ? (
            <ResourceAdjustmentDialog
              key={resourceAdjustmentStep.id}
              roadmapId={roadmapId}
              step={resourceAdjustmentStep}
              onClose={() => setResourceAdjustmentStep(null)}
            />
          ) : null}
          {data && adaptRoadmapOpen ? (
            <RoadmapAdaptationDialog roadmap={data} onClose={() => setAdaptRoadmapOpen(false)} onAdapted={refreshAdaptationHistory} />
          ) : null}
          {historyChangesToShow !== null ? (
            <PreviousStepVersionDialog
              changes={historyChangesToShow}
              adaptedAt={historyChangesToShow[0]?.adaptedAt ?? revisionsQuery.data?.items[0]?.created_at ?? new Date().toISOString()}
              onClose={() => { setHistoryChangesToShow(null); setHistoryOpenedFromJourney(false); }}
              onRequestRestore={openStepUndoConfirmation}
              canUndoAdaptation={historyOpenedFromJourney && hasAdaptationHistory && !data.archived_at}
              onRequestUndoAdaptation={() => { setHistoryChangesToShow(null); setHistoryOpenedFromJourney(false); openUndoConfirmation(); }}
            />
          ) : null}
          <UndoAdaptationConfirmDialog
            open={undoConfirmOpen || stepUndoTarget !== null}
            isLoading={undoAdaptationMutation.isPending || undoAdaptedStepMutation.isPending || restoreStepAdjustmentMutation.isPending}
            error={stepUndoTarget ? adaptedStepUndoError : adaptationUndoError}
            stepTitle={stepUndoTarget?.currentStep.title}
            onConfirm={confirmUndoAdaptation}
            onCancel={() => { setUndoConfirmOpen(false); setStepUndoTarget(null); }}
          />
        </>
      ) : null}
      </div>
    </AppLayout>
  );
}
