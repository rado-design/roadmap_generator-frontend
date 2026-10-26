import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout, PageHeader } from "../../app/layouts";
import { listRoadmaps } from "../../features/roadmaps/api/listRoadmaps";
import { RESOURCES_PAGE_SIZE, useResources, useSetResourceFavorite, type ResourceCategory, type ResourceItem, type ResourceSort, type StepProgressStatus } from "../../features/resources";
import { Button, Icon } from "../../shared/components";
import styles from "./ResourcesPage.module.scss";

const categories: Record<ResourceCategory, string> = {
  tech: "Technologie", languages: "Langues", sciences: "Sciences", business: "Business",
  creative: "Création", trades: "Métiers", life: "Vie pratique", hobbies: "Loisirs", other: "Autre",
};
const stepStatusLabels: Record<StepProgressStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminée",
};

function getSafeResourceUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
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
    const id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
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
  if (normalized.includes("video") || normalized.includes("vidéo")) return "Vidéo";
  if (normalized.includes("article")) return "Article";
  if (normalized.includes("course") || normalized.includes("cours")) return "Cours";
  if (normalized.includes("pdf")) return "PDF";
  if (normalized.includes("doc")) return "Documentation";
  return type;
}

function ResourcePreview({ resource }: { resource: ResourceItem }) {
  const url = getSafeResourceUrl(resource.url);
  if (!url) return <p className={styles.previewFallback}>Aucun aperçu n'est disponible pour cette ressource.</p>;

  const type = resource.type.toLocaleLowerCase("fr");
  const isVideo = type.includes("video") || type.includes("vidéo");
  const isDirectVideo = isVideo && /\.(mp4|webm|ogg|m3u8)$/i.test(url.pathname);
  const previewUrl = (isVideo ? getVideoEmbedUrl(url) : null) ?? url.href;

  return (
    <>
      {isDirectVideo ? (
        <video className={styles.resourceVideo} controls playsInline preload="metadata">
          <source src={url.href} />Votre navigateur ne peut pas lire cette vidéo.
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
      <p className={styles.previewHint}>Si le site ne permet pas l'aperçu intégré, ouvrez la ressource dans un nouvel onglet.</p>
    </>
  );
}

function ResourcePreviewDialog({ resource, onClose }: {
  resource: ResourceItem;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const safeUrl = getSafeResourceUrl(resource.url);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.resourceDialog}
      aria-labelledby="resource-preview-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className={styles.resourceDialogContent}>
        <header className={styles.resourceDialogHeader}>
          <div className={styles.resourceDialogHeading}>
            <p>{resource.roadmap.title} · étape {resource.step.order + 1}</p>
            <h2 id="resource-preview-title">{resource.title}</h2>
            <span>{getResourceTypeLabel(resource.type)}</span>
          </div>
          <button className={styles.closeResourceDialog} type="button" onClick={onClose} aria-label="Fermer l'aperçu">
            <Icon name="close" />
          </button>
        </header>
        <div className={styles.resourcePreview}><ResourcePreview resource={resource} /></div>
        <footer className={styles.resourceDialogFooter}>
          {safeUrl ? <a className={styles.openResourceLink} href={safeUrl.href} target="_blank" rel="noreferrer">Ouvrir la ressource <Icon name="open_in_new" /></a> : null}
        </footer>
      </div>
    </dialog>
  );
}

function ResourceIcon({ type }: { type: string }) {
  const value = type.toLocaleLowerCase("fr");
  const name = /video|vidéo/.test(value) ? "play_circle" : /pdf|doc/.test(value) ? "description" : /course|cours/.test(value) ? "school" : "article";
  return <Icon name={name} />;
}

function ResourceCard({ resource, pending, onFavorite, onOpenPreview, from }: {
  resource: ResourceItem;
  pending: boolean;
  onFavorite: (resource: ResourceItem) => void;
  onOpenPreview: () => void;
  from: { pathname: string; search: string; hash: string };
}) {
  const isVideo = /video|vidéo/i.test(resource.type);
  const date = new Date(resource.created_at);
  const dateLabel = Number.isNaN(date.getTime()) ? "Date indisponible" : new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(date);
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.typeIcon} aria-hidden="true"><ResourceIcon type={resource.type} /></span>
        <span className={`${styles.typePill} ${isVideo ? styles.videoType : ""}`}>{resource.type}</span>
        <button className={styles.favoriteButton} type="button" aria-label={resource.is_favorite ? `Retirer « ${resource.title} » des favoris` : `Ajouter « ${resource.title} » aux favoris`} aria-pressed={resource.is_favorite} aria-busy={pending} disabled={pending} onClick={() => onFavorite(resource)}>
          <Icon name={resource.is_favorite ? "star" : "star_border"} />
        </button>
      </div>
      <h2 className={styles.cardTitle}>
        <button type="button" onClick={onOpenPreview} className={styles.previewTrigger}>{resource.title}</button>
      </h2>
      <p className={styles.date}>{dateLabel}</p>
      <div className={styles.context}>
        <span>Roadmap</span>
        <Link to={`/roadmaps/${resource.roadmap.id}`} state={{ from }}>{resource.roadmap.title}</Link>
        <span className={styles.stepLabel}>Étape {resource.step.order + 1}</span>
        <div className={styles.stepRow}>
          <Link to={`/roadmaps/${resource.roadmap.id}#step-${resource.step.id}`} state={{ from }} title={resource.step.title}>{resource.step.title}</Link>
          <span className={`${styles.stepStatusBadge} ${styles[`stepStatus_${resource.step.status}`]}`}>
            {stepStatusLabels[resource.step.status]}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ResourcesPage() {
  const location = useLocation();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [roadmapId, setRoadmapId] = useState("all");
  const [category, setCategory] = useState<"all" | ResourceCategory>("all");
  const [type, setType] = useState("all");
  const [stepStatus, setStepStatus] = useState<"all" | StepProgressStatus>("all");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sort, setSort] = useState<ResourceSort>("recent");
  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);
  const [favoriteError, setFavoriteError] = useState("");
  const favoriteMutation = useSetResourceFavorite();

  useEffect(() => {
    const timeout = window.setTimeout(() => setAppliedSearch(search.slice(0, 100).trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const params = {
    limit: RESOURCES_PAGE_SIZE,
    search: appliedSearch || undefined,
    roadmap_id: roadmapId === "all" ? undefined : Number(roadmapId),
    category: category === "all" ? undefined : category,
    type: type === "all" ? undefined : type,
    step_status: stepStatus === "all" ? undefined : stepStatus,
    favorite: favoriteOnly ? true : undefined,
    sort,
  };
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useResources(params);
  const roadmapsQuery = useQuery({
    queryKey: ["roadmaps", "resource-filter-options"],
    queryFn: () => listRoadmaps({ limit: 100, offset: 0, sort: "recent" }),
  });
  const resources = data?.pages.flatMap((page) => page.items) ?? [];
  const typeValues = new Set(resources.map((resource) => resource.type).filter(Boolean));
  if (type !== "all") typeValues.add(type);
  const types = [...typeValues].sort((a, b) => a.localeCompare(b, "fr"));
  const errorMessage = error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : "Impossible de charger vos ressources. Vérifiez votre connexion puis réessayez.";
  const hasFilters = Boolean(appliedSearch || roadmapId !== "all" || category !== "all" || type !== "all" || stepStatus !== "all" || favoriteOnly);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage || isError || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void fetchNextPage();
    }, { rootMargin: "240px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isError, isFetchingNextPage, resources.length]);

  const clearFilters = () => {
    setSearch(""); setAppliedSearch(""); setRoadmapId("all"); setCategory("all"); setType("all"); setStepStatus("all");
    setFavoriteOnly(false); setSort("recent");
  };

  const toggleFavorite = (resource: ResourceItem) => {
    setFavoriteError("");
    favoriteMutation.mutate(
      { resourceId: resource.id, favorite: !resource.is_favorite },
      { onError: () => setFavoriteError("Impossible de mettre à jour ce favori. Réessayez.") },
    );
  };

  return (
    <AppLayout>
      <PageHeader
        title="Ressources"
        description="Retrouvez toutes les ressources de vos étapes, avec la roadmap et l'étape dont elles proviennent."
        actions={<span className={styles.resourceCount}>{isLoading ? "Chargement…" : `${data?.pages[0]?.total ?? 0} ressource${data?.pages[0]?.total === 1 ? "" : "s"}`}</span>}
      />

      <section className={styles.filters} aria-label="Recherche et filtres des ressources">
        <div className={styles.filterField}>
          <label htmlFor="resource-search">Recherche</label>
          <input id="resource-search" type="search" value={search} maxLength={100} placeholder="Titre de la ressource…" onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className={styles.filterField}>
          <label htmlFor="resource-roadmap">Roadmap</label>
          <select id="resource-roadmap" value={roadmapId} onChange={(event) => setRoadmapId(event.target.value)}>
            <option value="all">Toutes les roadmaps</option>
            {roadmapsQuery.data?.items.map((roadmap) => <option key={roadmap.id} value={roadmap.id}>{roadmap.title}</option>)}
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="resource-type">Type</label>
          <select id="resource-type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="all">Tous les types</option>
            {types.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="resource-step-status">Statut de l'étape</label>
          <select id="resource-step-status" value={stepStatus} onChange={(event) => setStepStatus(event.target.value as "all" | StepProgressStatus)}>
            <option value="all">Tous les statuts</option>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminée</option>
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="resource-category">Catégorie</label>
          <select id="resource-category" value={category} onChange={(event) => setCategory(event.target.value as "all" | ResourceCategory)}>
            <option value="all">Toutes les catégories</option>
            {Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="resource-sort">Trier par</label>
          <select id="resource-sort" value={sort} onChange={(event) => setSort(event.target.value as ResourceSort)}>
            <option value="recent">Plus récentes</option><option value="oldest">Plus anciennes</option>
          </select>
        </div>
        <div className={styles.filterFooter}>
          <label className={styles.favoriteFilter}>
            <input type="checkbox" checked={favoriteOnly} onChange={(event) => setFavoriteOnly(event.target.checked)} />
            <Icon name="star" />Mes favoris
          </label>
        </div>
      </section>

      {favoriteError ? <p className={styles.favoriteError} role="alert">{favoriteError}</p> : null}
      {isLoading ? (
        <div className={styles.grid} aria-label="Chargement des ressources" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => <div className={styles.skeleton} key={index} aria-hidden="true" />)}
        </div>
      ) : isError && resources.length === 0 ? (
        <section className={styles.emptyState} role="alert"><Icon name="cloud_off" /><p>{errorMessage}</p><Button variant="outline" onClick={() => void refetch()} isLoading={isFetching}>Réessayer</Button></section>
      ) : resources.length === 0 ? (
        <section className={styles.emptyState}>
          <Icon name={hasFilters ? "search_off" : "menu_book"} />
          <h2>{hasFilters ? "Aucune ressource trouvée" : "Aucune ressource pour le moment"}</h2>
          <p>{hasFilters ? "Modifiez vos filtres pour afficher des ressources." : "Les ressources de vos roadmaps apparaîtront ici."}</p>
          {hasFilters ? <Button variant="outline" onClick={clearFilters}>Effacer les filtres</Button> : null}
        </section>
      ) : (
        <>
          <div className={styles.grid}>
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                pending={favoriteMutation.isPending && favoriteMutation.variables?.resourceId === resource.id}
                onFavorite={toggleFavorite}
                onOpenPreview={() => setPreviewResource(resource)}
                from={{ pathname: location.pathname, search: location.search, hash: location.hash }}
              />
            ))}
          </div>
          <div className={styles.listFooter}>
            <p>{resources.length} ressource{resources.length === 1 ? "" : "s"} affichée{resources.length === 1 ? "" : "s"} sur {data?.pages[0]?.total ?? 0}</p>
          </div>
          {hasNextPage || isFetchingNextPage || isFetchNextPageError ? (
            <div ref={loadMoreRef} className={styles.loadMoreArea}>
              {isFetchNextPageError ? <p role="alert">Impossible de charger les ressources suivantes.</p> : null}
              <Button variant="outline" onClick={() => void fetchNextPage()} isLoading={isFetchingNextPage} aria-label={isFetchingNextPage ? "Chargement des ressources suivantes" : undefined}>
                {isFetchNextPageError ? "Réessayer" : "Charger plus"}
              </Button>
            </div>
          ) : null}
        </>
      )}
      {previewResource ? (
        <ResourcePreviewDialog
          resource={previewResource}
          onClose={() => setPreviewResource(null)}
        />
      ) : null}
    </AppLayout>
  );
}
