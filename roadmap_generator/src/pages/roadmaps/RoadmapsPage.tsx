import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AppLayout, PageHeader } from "../../app/layouts";
import { useRoadmaps, type RoadmapCategoryGroup, type RoadmapSort, type RoadmapStatus, type RoadmapSummary } from "../../features/roadmaps";
import { useRoadmapGenerationStore } from "../../features/roadmaps/hooks/useRoadmapGenerationStore";
import { Button } from "../../shared/components/Button";
import { FilterSelect } from "../../shared/components/FilterSelect/FilterSelect";
import { Icon } from "../../shared/components/Icon";
import styles from "./RoadmapsPage.module.scss";

const EMPTY_ROADMAPS: RoadmapSummary[] = [];
const categoryLabels: Record<RoadmapCategoryGroup, string> = {
  tech: "Technologie",
  languages: "Langues",
  sciences: "Sciences",
  business: "Business",
  creative: "Création",
  trades: "Métiers",
  life: "Vie pratique",
  hobbies: "Loisirs",
  other: "Autre",
};
const categoryIcons: Record<RoadmapCategoryGroup, string> = {
  tech: "code",
  languages: "translate",
  sciences: "science",
  business: "business_center",
  creative: "palette",
  trades: "handyman",
  life: "home",
  hobbies: "sports_esports",
  other: "school",
};

const statusLabels: Record<RoadmapStatus, string> = {
  generating: "Génération en cours",
  ready: "Prête",
  failed: "Échec de génération",
};

function getGenerationCategoryGroup(category: string | undefined): RoadmapCategoryGroup {
  switch (category) {
    case "programming":
    case "mobile_dev":
    case "ux_ui_design":
      return "tech";
    case "marketing_sales":
    case "project_management":
      return "business";
    default:
      return "other";
  }
}

function getProgress(roadmap: RoadmapSummary) {
  if (roadmap.total_steps === 0) return 0;
  return Math.min(100, Math.round((roadmap.completed_steps / roadmap.total_steps) * 100));
}

function formatCreationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date indisponible";
  return `Créée le ${new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)}`;
}

function RoadmapCard({ roadmap, from, archived }: {
  roadmap: RoadmapSummary;
  from: { pathname: string; search: string; hash: string };
  archived: boolean;
}) {
  const progress = getProgress(roadmap);
  const statusClass = roadmap.status === "failed"
    ? styles.failed
    : roadmap.status === "generating"
      ? styles.generating
      : styles.ready;

  return (
    <article className={`${styles.card} ${archived ? styles.archivedCard : ""}`}>
      <div className={styles.cardTop}>
        <span className={styles.categoryIcon} data-category={roadmap.category} aria-hidden="true"><Icon name={categoryIcons[roadmap.category]} /></span>
        <span className={styles.categoryName}>{categoryLabels[roadmap.category]}</span>
        <div className={styles.cardBadges}>
          <span className={`${styles.status} ${statusClass}`}>{statusLabels[roadmap.status]}</span>
          {archived ? <span className={styles.archivedBadge}>Archivée</span> : null}
        </div>
      </div>
      <h2 className={styles.cardTitle}><Link to={`/roadmaps/${roadmap.id}`} state={{ from }}><span>{roadmap.title}</span><Icon name="open_in_new" /></Link></h2>
      <p className={styles.goal}>{roadmap.goal}</p>
      <div className={styles.cardFacts}>
        <span><Icon name="checklist" />{roadmap.completed_steps}/{roadmap.total_steps} étapes</span>
        <span><Icon name="calendar_today" />{formatCreationDate(roadmap.created_at).replace("Créée le ", "")}</span>
      </div>
      <div className={styles.progressMeta}>
        <span>Progression</span>
        <strong>{progress}%</strong>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={`Progression de ${roadmap.title}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
    </article>
  );
}

function GenerationCard({ title, goal, stepsReceived, from }: {
  title: string;
  goal: string;
  stepsReceived: number;
  from: { pathname: string; search: string; hash: string };
}) {
  return (
    <Link
      className={styles.card}
      to="/roadmaps/generate"
      state={{ from }}
      aria-label={`Suivre la génération de ${title}`}
    >
      <div className={styles.cardTop}>
        <span className={styles.categoryIcon} aria-hidden="true"><Icon name="auto_awesome" /></span>
        <span className={styles.categoryName}>Roadmap en préparation</span>
        <span className={`${styles.status} ${styles.generating}`}>{statusLabels.generating}</span>
      </div>
      <h2 className={styles.cardTitle}>{title}<Icon name="open_in_new" /></h2>
      <p className={styles.goal}>{goal}</p>
      <div className={styles.cardFacts}>
        <span><Icon name="checklist" />{stepsReceived} étape{stepsReceived === 1 ? "" : "s"} reçue{stepsReceived === 1 ? "" : "s"}</span>
        <span><Icon name="autorenew" />Suivi en direct</span>
      </div>
      <span className={styles.generationProgressHint}>Sélectionnez pour suivre la génération</span>
    </Link>
  );
}

function RoadmapSkeleton() {
  return <div className={styles.skeleton} aria-hidden="true" />;
}

export function RoadmapsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const generation = useRoadmapGenerationStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RoadmapStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | RoadmapCategoryGroup>("all");
  const [sortOrder, setSortOrder] = useState<RoadmapSort>("recent");
  const showArchived = new URLSearchParams(location.search).get("archived") === "true";
  const [appliedSearch, setAppliedSearch] = useState("");
  useEffect(() => {
    const timeout = window.setTimeout(() => setAppliedSearch(searchQuery.slice(0, 100)), 250);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);
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
  } = useRoadmaps({
    search: appliedSearch,
    status: statusFilter,
    category: categoryFilter,
    sort: sortOrder,
    archived: showArchived,
  });
  const items = data?.pages.flatMap((page) => page.items) ?? EMPTY_ROADMAPS;
  const total = data?.pages[0]?.total ?? 0;
  const generationActive = generation.status === "connecting" || generation.status === "streaming";
  const generationTitle = generation.title ?? "Nouvelle roadmap en préparation";
  const generationGoal = generation.request?.goal ?? "";
  const generationCategory = getGenerationCategoryGroup(generation.request?.category);
  const appliedSearchNormalized = appliedSearch.trim().toLocaleLowerCase("fr-FR");
  const generationMatchesFilters = generationActive
    && !showArchived
    && (statusFilter === "all" || statusFilter === "generating")
    && (categoryFilter === "all" || categoryFilter === generationCategory)
    && (!appliedSearchNormalized || `${generationTitle} ${generationGoal}`.toLocaleLowerCase("fr-FR").includes(appliedSearchNormalized));
  const displayedTotal = total + Number(generationMatchesFilters);
  const displayedCount = items.length + Number(generationMatchesFilters);
  const problemDetail = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
    : undefined;
  const errorMessage = typeof problemDetail === "string"
    ? problemDetail
    : "Impossible de charger vos roadmaps. Vérifiez votre connexion puis réessayez.";

  const setArchiveView = (archived: boolean) => {
    const params = new URLSearchParams(location.search);
    if (archived) params.set("archived", "true");
    else params.delete("archived");
    const query = params.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ""}`, { replace: true });
  };

  const openNewGeneration = () => {
    generation.startNew();
    navigate("/roadmaps/generate", {
      state: { from: { pathname: location.pathname, search: location.search, hash: location.hash } },
    });
  };

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage || isError || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void fetchNextPage();
    }, { rootMargin: "240px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isError, isFetchingNextPage, items.length]);

  return (
    <AppLayout onSearch={(query) => setSearchQuery(query.slice(0, 100))}>
      <PageHeader
        title={showArchived ? "Roadmaps archivées" : "Toutes les roadmaps"}
        description={showArchived ? "Consultez et restaurez vos roadmaps archivées." : "Gérez et suivez l'avancement de vos projets stratégiques."}
        actions={(
          <div className={styles.headerActions}>
            <Button variant="outline" disabled title="L'export sera ajouté dans une prochaine étape.">
              Exporter
            </Button>
          <Button icon="add" onClick={openNewGeneration}>
              Créer une roadmap
            </Button>
          </div>
        )}
      />

      <div className={styles.archiveToggle} aria-label="Filtrer les roadmaps par archivage">
        <button type="button" aria-pressed={!showArchived} className={!showArchived ? styles.archiveToggleActive : ""} onClick={() => setArchiveView(false)}>Actives</button>
        <button type="button" aria-pressed={showArchived} className={showArchived ? styles.archiveToggleActive : ""} onClick={() => setArchiveView(true)}>Archivées</button>
      </div>

      <section className={styles.filters} aria-label="Recherche et filtres des roadmaps">
        <div className={styles.filterField}>
          <label htmlFor="roadmap-search">Recherche</label>
          <div className={styles.searchControl}>
            <Icon name="search" />
            <input id="roadmap-search" type="search" placeholder="Rechercher une roadmap…" value={searchQuery} maxLength={100} onChange={(event) => setSearchQuery(event.target.value)} />
          </div>
        </div>
        <div className={styles.filterField}>
          <FilterSelect label="Trier par" value={sortOrder} onChange={(value) => setSortOrder(value as RoadmapSort)} options={[
            { value: "recent", label: "Plus récent" },
            { value: "oldest", label: "Plus ancien" },
            { value: "progress", label: "Progression" },
          ]} />
        </div>
        <div className={styles.filterField}>
          <FilterSelect label="Catégorie" value={categoryFilter} onChange={(value) => setCategoryFilter(value as "all" | RoadmapCategoryGroup)} options={[
            { value: "all", label: "Toutes les catégories" },
            ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
          ]} />
        </div>
        <div className={styles.filterField}>
          <FilterSelect label="Statut" value={statusFilter} onChange={(value) => setStatusFilter(value as "all" | RoadmapStatus)} options={[
            { value: "all", label: "Tous les statuts" },
            { value: "generating", label: "Génération en cours" },
            { value: "ready", label: "Prête" },
            { value: "failed", label: "Échec de génération" },
          ]} />
        </div>
        <p className={styles.filterNote}>
          La génération en cours reste affichée en tête si elle correspond aux filtres sélectionnés.
        </p>
      </section>

      {isLoading && !generationMatchesFilters ? (
        <div className={styles.grid} aria-label="Chargement des roadmaps" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => <RoadmapSkeleton key={index} />)}
        </div>
      ) : isError && items.length === 0 && !generationMatchesFilters ? (
        <section className={styles.emptyState} role="alert">
          <Icon name="cloud_off" />
          <p>{errorMessage}</p>
          <Button variant="outline" onClick={() => void refetch()} isLoading={isFetching}>Réessayer</Button>
        </section>
      ) : total === 0 && !appliedSearch.trim() && statusFilter === "all" && categoryFilter === "all" && !generationMatchesFilters ? (
        <section className={styles.emptyState}>
          <Icon name="route" />
          <h2>{showArchived ? "Aucune roadmap archivée" : "Aucune roadmap pour le moment"}</h2>
          <p>{showArchived ? "Les roadmaps que vous archivez apparaîtront ici." : "Les roadmaps que vous créerez apparaîtront ici."}</p>
          {!showArchived ? <Button icon="add" onClick={openNewGeneration}>Nouvelle roadmap</Button> : null}
        </section>
      ) : total === 0 && !generationMatchesFilters ? (
        <section className={styles.emptyState}>
          <Icon name="search_off" />
          <h2>Aucun résultat</h2>
          <p>Modifiez la recherche ou les filtres pour afficher des roadmaps.</p>
          <Button variant="outline" onClick={() => { setSearchQuery(""); setAppliedSearch(""); setStatusFilter("all"); setCategoryFilter("all"); setSortOrder("recent"); }}>
            Effacer les filtres
          </Button>
        </section>
      ) : (
        <>
          <div className={styles.grid}>
            {generationMatchesFilters ? (
              <GenerationCard
                title={generationTitle}
                goal={generationGoal}
                stepsReceived={generation.steps.length}
                from={{ pathname: location.pathname, search: location.search, hash: location.hash }}
              />
            ) : null}
            {items.map((roadmap) => (
              <RoadmapCard
                key={roadmap.id}
                roadmap={roadmap}
                from={{ pathname: location.pathname, search: location.search, hash: location.hash }}
                archived={showArchived}
              />
            ))}
            {!showArchived ? <Link
              className={styles.createCard}
              to="/roadmaps/generate"
              state={{ from: { pathname: location.pathname, search: location.search, hash: location.hash } }}
              onClick={() => generation.startNew()}
              aria-label="Créer une nouvelle roadmap"
            >
              <span className={styles.createIcon}><Icon name="add" /></span>
              <strong>Nouvelle roadmap</strong>
              <span>Créer un nouveau parcours personnalisé.</span>
            </Link> : null}
          </div>
          <div className={styles.listFooter}>
            <p>
              {displayedCount} résultat{displayedCount === 1 ? "" : "s"} affiché{displayedCount === 1 ? "" : "s"} sur {displayedTotal}
            </p>
          </div>
          {hasNextPage || isFetchingNextPage || isFetchNextPageError ? (
            <div ref={loadMoreRef} className={styles.loadMoreArea}>
              {isFetchNextPageError ? <p role="alert">Impossible de charger les roadmaps suivantes.</p> : null}
              <Button variant="outline" onClick={() => void fetchNextPage()} isLoading={isFetchingNextPage} aria-label={isFetchingNextPage ? "Chargement des roadmaps suivantes" : undefined}>
                {isFetchNextPageError ? "Réessayer" : "Charger plus"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </AppLayout>
  );
}
