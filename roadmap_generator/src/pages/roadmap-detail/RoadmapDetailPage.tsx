import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router";
import { AppLayout } from "../../app/layouts";
import {
  useRoadmapDetail,
  type RoadmapDetail,
  type RoadmapResource,
  type RoadmapStep,
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

function StepCard({ step }: { step: RoadmapStep }) {
  const isDone = step.progress.status === "done";
  const isActive = step.progress.status === "in_progress";

  return (
    <article className={`${styles.stepCard} ${isActive ? styles.activeStep : ""}`}>
      <span
        className={`${styles.checkpoint} ${isDone ? styles.completedCheckpoint : ""} ${isActive ? styles.activeCheckpoint : ""}`}
        aria-hidden="true"
      >
        {isDone ? <Icon name="check" /> : null}
      </span>
      <div className={styles.stepBody}>
        <div className={styles.stepHeading}>
          <h3 className={`${styles.stepTitle} ${isDone ? styles.completedTitle : ""}`}>{step.title}</h3>
          <span className={`${styles.stepStatus} ${isActive ? styles.activeStatus : ""}`}>
            {stepStatusLabels[step.progress.status]}
          </span>
        </div>
        <p className={styles.stepDescription}>{step.description}</p>
        {step.learning_objectives.length > 0 ? (
          <ul className={styles.objectives} aria-label="Objectifs d'apprentissage">
            {step.learning_objectives.map((objective, index) => (
              <li key={`${step.id}-${index}`}>{objective}</li>
            ))}
          </ul>
        ) : null}
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
      {resource.url ? <Icon name="open_in_new" className={styles.externalIcon} /> : null}
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
  const returnPath = returnToDashboard
    ? `/dashboard${origin?.search ?? ""}${origin?.hash ?? ""}`
    : returnToRoadmaps
      ? `/roadmaps${origin?.search ?? ""}${origin?.hash ?? ""}`
      : "/roadmaps";
  const returnLabel = returnToDashboard ? "Retour au tableau de bord" : "Retour à toutes les roadmaps";
  const { roadmapId: routeId } = useParams();
  const parsedId = Number(routeId);
  const roadmapId = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : null;
  const { data, isLoading, isError, error, refetch, isFetching } = useRoadmapDetail(roadmapId);
  const orderedSteps = useMemo(
    () => [...(data?.steps ?? [])].sort((left, right) => left.order - right.order),
    [data?.steps],
  );
  const completedSteps = orderedSteps.filter((step) => step.progress.status === "done");
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

          <div className={styles.columns}>
            <div className={styles.stepsColumn}>
              {completedSteps.length > 0 ? (
                <section aria-labelledby="completed-steps-title">
                  <h2 className={styles.sectionTitle} id="completed-steps-title">
                    <Icon name="check_circle" />Étapes validées ({completedSteps.length})
                  </h2>
                  <div className={styles.stepList}>
                    {completedSteps.map((step) => <StepCard key={step.id} step={step} />)}
                  </div>
                </section>
              ) : null}

              <section className={styles.upcomingSection} aria-labelledby="upcoming-steps-title">
                <h2 className={styles.sectionTitle} id="upcoming-steps-title">Prochaines étapes</h2>
                {remainingSteps.length > 0 ? (
                  <div className={styles.stepList}>
                    {remainingSteps.map((step) => <StepCard key={step.id} step={step} />)}
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
              <section className={styles.momentumTemplate}>
                <span className={styles.templateLabel}>Gabarit · backend à compléter</span>
                <h2>Momentum</h2>
                <p>Les analyses de progression et les badges seront affichés lorsque les données correspondantes seront disponibles.</p>
                <Button disabled title="Les badges ne sont pas encore disponibles.">Voir les badges</Button>
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

              <section className={styles.asideCard} aria-labelledby="participants-title">
                <h2 id="participants-title">Participants</h2>
                <p className={styles.asideNote}>La gestion des participants n'est pas encore disponible.</p>
                <Button variant="outline" disabled title="Les invitations ne sont pas encore disponibles.">
                  Inviter un collègue
                </Button>
              </section>
            </aside>
          </div>
        </>
      ) : null}
    </AppLayout>
  );
}
