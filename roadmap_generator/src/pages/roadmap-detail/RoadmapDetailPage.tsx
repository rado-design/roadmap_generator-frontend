import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router";
import { AppLayout } from "../../app/layouts";
import {
  useRoadmapDetail,
  useProposeStepAdjustment,
  useDecideStepAdjustment,
  useProposeResourceAdjustment,
  useDecideResourceAdjustment,
  useSetStepProgress,
  type RoadmapDetail,
  type RoadmapResource,
  type RoadmapStep,
  type StepAdjustment,
  type StepContent,
  type ResourceAdjustment,
} from "../../features/roadmaps";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import styles from "./RoadmapDetailPage.module.scss";

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
  if (!url) {
    return <p className={styles.previewFallback}>Aucun aperçu n'est disponible pour cette ressource.</p>;
  }

  const type = resource.type.toLocaleLowerCase("fr");
  const isVideo = type.includes("video");
  const isDirectVideo = isVideo && /\.(mp4|webm|ogg|m3u8)$/i.test(url.pathname);
  const videoEmbedUrl = isVideo ? getVideoEmbedUrl(url) : null;
  const previewUrl = videoEmbedUrl ?? url.href;

  return (
    <>
      {isDirectVideo ? (
        <video className={styles.resourceVideo} controls playsInline preload="metadata">
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
        />
      )}
      <p className={styles.previewHint}>
        Si le site ne permet pas l'aperçu intégré, ouvrez la ressource dans un nouvel onglet.
      </p>
    </>
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
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return fallback;
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
              <p className={styles.adjustmentError} role="alert">
                {getActionError(proposeMutation.error, "La proposition n’a pas pu être générée. Réessayez.")}
              </p>
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
              <p className={styles.adjustmentError} role="alert">
                {getActionError(proposeMutation.error, "Les ressources n’ont pas pu être générées. Réessayez.")}
              </p>
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
  step,
  isUpdating,
  onProgressChange,
  onOpenResources,
  onAdjustStep,
  onAdjustResources,
  allowAdjustment,
}: {
  step: RoadmapStep;
  isUpdating: boolean;
  onProgressChange: (stepId: number, status: RoadmapStep["progress"]["status"]) => void;
  onOpenResources: (stepId: number) => void;
  onAdjustStep: (step: RoadmapStep) => void;
  onAdjustResources: (step: RoadmapStep) => void;
  allowAdjustment: boolean;
}) {
  const isDone = step.progress.status === "done";
  const isActive = step.progress.status === "in_progress";

  return (
    <article id={`step-${step.id}`} className={`${styles.stepCard} ${isActive ? styles.activeStep : ""}`}>
      <button
        className={`${styles.checkpoint} ${isDone ? styles.completedCheckpoint : ""} ${isActive ? styles.activeCheckpoint : ""}`}
        type="button"
        role="checkbox"
        aria-checked={isDone}
        aria-label={isDone ? `Marquer « ${step.title} » comme à faire` : `Marquer « ${step.title} » comme terminée`}
        disabled={isUpdating}
        aria-busy={isUpdating}
        onClick={() => onProgressChange(step.id, isDone ? "todo" : "done")}
      >
        {isDone ? <Icon name="check" /> : null}
      </button>
      <div className={styles.stepBody}>
        <div className={styles.stepHeading}>
          <h3 className={`${styles.stepTitle} ${isDone ? styles.completedTitle : ""}`}>{step.title}</h3>
          <select
            className={`${styles.stepStatus} ${isActive ? styles.activeStatus : ""} ${isDone ? styles.doneStatus : ""}`}
            aria-label={`Statut de l'étape ${step.title}`}
            value={step.progress.status}
            disabled={isUpdating}
            onChange={(event) => onProgressChange(step.id, event.target.value as RoadmapStep["progress"]["status"])}
          >
            {Object.entries(stepStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <p className={styles.stepDescription}>{step.description}</p>
        {step.learning_objectives.length > 0 ? (
          <ul className={styles.objectives} aria-label="Objectifs d'apprentissage">
            {step.learning_objectives.map((objective, index) => (
              <li key={`${step.id}-${index}`}>{objective}</li>
            ))}
          </ul>
        ) : null}
        <div className={styles.stepActions}>
          {step.resources.length > 0 ? (
            <Button
              className={styles.stepResourcesButton}
              variant="outline"
              icon="collections_bookmark"
              type="button"
              onClick={() => onOpenResources(step.id)}
              aria-label={`Voir les ${step.resources.length} ressources de l'étape ${step.title}`}
            >
              Ressources ({step.resources.length})
            </Button>
          ) : <p className={styles.noStepResources}>Aucune ressource liée à cette étape.</p>}
          {allowAdjustment && step.progress.status === "todo" ? (
            <Button
              className={styles.stepResourcesButton}
              variant="outline"
              icon="auto_awesome"
              type="button"
              disabled={isUpdating}
              onClick={() => onAdjustStep(step)}
            >
              Régénérer l’étape
            </Button>
          ) : null}
          {allowAdjustment ? (
            <Button
              className={styles.stepResourcesButton}
              variant="outline"
              icon="refresh"
              type="button"
              disabled={isUpdating}
              onClick={() => onAdjustResources(step)}
            >
              Régénérer les ressources
            </Button>
          ) : null}
          {allowAdjustment && step.progress.status !== "todo" ? (
            <p className={styles.noStepResources}>Remettez l’étape « À faire » pour régénérer son contenu.</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ResourceItem({ resource, stepTitle, index }: {
  resource: RoadmapResource;
  stepTitle: string;
  index: number;
}) {
  const content = (
    <>
      <span className={styles.resourceIcon}><ResourceIcon type={resource.type} /></span>
      <span className={styles.resourceCopy}>
        <strong>{resource.title}</strong>
        <small>{resource.type} · {stepTitle}</small>
      </span>
      <span className={styles.resourceActionSlot} aria-hidden="true">
        {resource.url ? <Icon name="open_in_new" className={styles.externalIcon} /> : null}
      </span>
    </>
  );

  return resource.url ? (
    <a
      className={styles.resourceItem}
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      key={`${stepTitle}-${index}-${resource.title}`}
    >
      {content}
    </a>
  ) : (
    <div className={styles.resourceItem} key={`${stepTitle}-${index}-${resource.title}`}>
      {content}
    </div>
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
  const progressMutation = useSetStepProgress(roadmapId);
  const [resourceViewer, setResourceViewer] = useState<{ stepId: number; index: number } | null>(null);
  const [adjustmentStep, setAdjustmentStep] = useState<RoadmapStep | null>(null);
  const [resourceAdjustmentStep, setResourceAdjustmentStep] = useState<RoadmapStep | null>(null);
  const orderedSteps = useMemo(
    () => [...(data?.steps ?? [])].sort((left, right) => left.order - right.order),
    [data?.steps],
  );

  useEffect(() => {
    if (!data || !location.hash) return;
    const targetId = decodeURIComponent(location.hash.slice(1));
    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [data, location.hash]);
  const completedSteps = orderedSteps.filter((step) => step.progress.status === "done");
  const inProgressSteps = orderedSteps.filter((step) => step.progress.status === "in_progress");
  const remainingSteps = orderedSteps
    .filter((step) => step.progress.status !== "done")
    .sort((left, right) => {
      const activeDifference = Number(right.progress.status === "in_progress")
        - Number(left.progress.status === "in_progress");
      return activeDifference || left.order - right.order;
    });
  const activeRoadmapStatus = data ? roadmapStatusLabels[data.status] : "";
  const progress = data ? getProgress(data) : 0;
  const resources = orderedSteps.flatMap((step) =>
    step.resources.map((resource) => ({ resource, stepTitle: step.title })),
  );
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

  const updateProgress = (stepId: number, status: RoadmapStep["progress"]["status"]) => {
    progressMutation.mutate({ roadmapId: roadmapId!, stepId, status });
  };
  const openStepResources = (stepId: number) => setResourceViewer({ stepId, index: 0 });
  const changeResourceIndex = (index: number) => setResourceViewer((current) => current ? { ...current, index } : current);
  const closeResourceViewer = useCallback(() => setResourceViewer(null), []);

  return (
    <AppLayout>
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
          <section className={styles.summary} aria-labelledby="roadmap-title">
            <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
              <Link to="/roadmaps">Mes roadmaps</Link>
              <Icon name="chevron_right" />
              <span aria-current="page">{data.title}</span>
            </nav>
            <div className={styles.summaryHeading}>
              <div className={styles.summaryCopy}>
                <h1 id="roadmap-title">{data.title}</h1>
                <p>{data.goal}</p>
              </div>
              <div className={styles.summaryProgress}>
                <span className={`${styles.roadmapStatus} ${styles[data.status]}`}>
                  {activeRoadmapStatus}
                </span>
                <strong>{progress}%</strong>
              </div>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="Progression de la roadmap"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.summaryMeta}>
              <span>Créée le {formatDate(data.created_at)}</span>
              <span>{data.completed_steps} / {data.total_steps} étapes terminées</span>
            </div>
          </section>

          {data.archived_at ? (
            <div className={styles.archivedNotice} role="status">
              <Icon name="archive" />
              <span>Cette roadmap est archivée et consultable en lecture seule. Désarchivez-la depuis la liste des roadmaps pour modifier sa progression.</span>
            </div>
          ) : null}

          {progressMutation.isError ? (
            <div className={styles.progressError} role="alert">
              <Icon name="error" />
              <span>{progressError}</span>
            </div>
          ) : null}

          <div className={styles.columns}>
            <div className={styles.stepsColumn}>
              {completedSteps.length > 0 ? (
                <section aria-labelledby="completed-steps-title">
                  <h2 className={styles.sectionTitle} id="completed-steps-title">
                    <Icon name="check_circle" />Étapes validées ({completedSteps.length})
                  </h2>
                  <div className={styles.stepList}>
                    {completedSteps.map((step) => (
                      <StepCard key={step.id} step={step} isUpdating={progressMutation.isPending || Boolean(data.archived_at)} allowAdjustment={!data.archived_at} onProgressChange={updateProgress} onOpenResources={openStepResources} onAdjustStep={setAdjustmentStep} onAdjustResources={setResourceAdjustmentStep} />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className={styles.upcomingSection} aria-labelledby="upcoming-steps-title">
                <h2 className={styles.sectionTitle} id="upcoming-steps-title">Prochaines étapes</h2>
                {remainingSteps.length > 0 ? (
                  <div className={styles.stepList}>
                    {remainingSteps.map((step) => (
                      <StepCard key={step.id} step={step} isUpdating={progressMutation.isPending || Boolean(data.archived_at)} allowAdjustment={!data.archived_at} onProgressChange={updateProgress} onOpenResources={openStepResources} onAdjustStep={setAdjustmentStep} onAdjustResources={setResourceAdjustmentStep} />
                    ))}
                  </div>
                ) : completedSteps.length > 0 ? (
                  <p className={styles.completionMessage}>Toutes les étapes de cette roadmap sont terminées.</p>
                ) : (
                  <div className={styles.noSteps}>
                    <Icon name="route" />
                    <p>Aucune étape n'est encore disponible pour cette roadmap.</p>
                  </div>
                )}
              </section>
            </div>

            <aside className={styles.aside} aria-label="Informations complémentaires">
              <section className={styles.asideCard} aria-labelledby="overview-title">
                <h2 id="overview-title">Vue d'ensemble</h2>
                <dl className={styles.overviewStats}>
                  <div className={styles.overviewStat}>
                    <dt>Validées</dt>
                    <dd>{completedSteps.length} / {data.total_steps}</dd>
                  </div>
                  <div className={styles.overviewStat}>
                    <dt>En cours</dt>
                    <dd>{inProgressSteps.length}</dd>
                  </div>
                  <div className={styles.overviewStat}>
                    <dt>Ressources</dt>
                    <dd>{resources.length}</dd>
                  </div>
                </dl>
              </section>

              <section className={styles.asideCard} aria-labelledby="resources-title">
                <h2 id="resources-title">Ressources clés</h2>
                {resources.length > 0 ? (
                  <div className={styles.resourceList}>
                    {resources.map(({ resource, stepTitle }, index) => (
                      <ResourceItem key={`${stepTitle}-${index}-${resource.title}`} resource={resource} stepTitle={stepTitle} index={index} />
                    ))}
                  </div>
                ) : (
                  <p className={styles.asideNote}>Aucune ressource n'est associée aux étapes de cette roadmap.</p>
                )}
              </section>
            </aside>
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
        </>
      ) : null}
    </AppLayout>
  );
}
