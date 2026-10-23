import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AppLayout, PageHeader } from "../../app/layouts";
import { useRoadmaps, type RoadmapCategoryGroup, type RoadmapSort, type RoadmapStatus, type RoadmapSummary } from "../../features/roadmaps";
import { Button } from "../../shared/components/Button";
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

const statusLabels: Record<RoadmapStatus, string> = {
  generating: "Génération en cours",
  ready: "Prête",
  failed: "Échec de génération",
};

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

function RoadmapCard({ roadmap, from }: { roadmap: RoadmapSummary; from: { pathname: string; search: string; hash: string } }) {
  const progress = getProgress(roadmap);
  const statusClass = roadmap.status === "failed"
    ? styles.failed
    : roadmap.status === "generating"
      ? styles.generating
      : styles.ready;

  return (
    <Link className={styles.card} to={`/roadmaps/${roadmap.id}`} state={{ from }}>
      <span className={`${styles.status} ${statusClass}`}>{statusLabels[roadmap.status]}</span>
      <h2 className={styles.cardTitle}>{roadmap.title}</h2>
      <p className={styles.goal}>{roadmap.goal}</p>
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
      <div className={styles.cardMeta}>
        <span className={styles.dateIcon} aria-hidden="true"><Icon name="calendar_today" /></span>
        <span>{formatCreationDate(roadmap.created_at)}</span>
      </div>
    </Link>
  );
}

function RoadmapSkeleton() {
  return <div className={styles.skeleton} aria-hidden="true" />;
}

export function RoadmapsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RoadmapStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | RoadmapCategoryGroup>("all");
  const [sortOrder, setSortOrder] = useState<RoadmapSort>("recent");
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
  });
  const items = data?.pages.flatMap((page) => page.items) ?? EMPTY_ROADMAPS;
  const total = data?.pages[0]?.total ?? 0;
  const problemDetail = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
    : undefined;
  const errorMessage = typeof problemDetail === "string"
    ? problemDetail
    : "Impossible de charger vos roadmaps. Vérifiez votre connexion puis réessayez.";

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
        title="Toutes les roadmaps"
        description="Gérez et suivez l'avancement de vos projets stratégiques."
        actions={(
          <div className={styles.headerActions}>
            <Button variant="outline" disabled title="L'export sera ajouté dans une prochaine étape.">
              Exporter
            </Button>
            <Button icon="add" onClick={() => navigate("/roadmaps/generate")}>
              Créer une roadmap
            </Button>
          </div>
        )}
      />

      <section className={styles.filters} aria-label="Recherche et filtres des roadmaps">
        <div className={styles.filterField}>
          <label htmlFor="roadmap-search">Recherche</label>
          <input
            id="roadmap-search"
            type="search"
            placeholder="Titre du projet…"
            value={searchQuery}
            maxLength={100}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className={styles.filterField}>
          <label htmlFor="roadmap-category">Catégorie</label>
          <select
            id="roadmap-category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as "all" | RoadmapCategoryGroup)}
          >
            <option value="all">Toutes les catégories</option>
            {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="roadmap-status">Statut</label>
          <select
            id="roadmap-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | RoadmapStatus)}
          >
            <option value="all">Tous les statuts</option>
            <option value="generating">Génération en cours</option>
            <option value="ready">Prête</option>
            <option value="failed">Échec de génération</option>
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="roadmap-sort">Trier par</label>
          <select id="roadmap-sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as RoadmapSort)}>
            <option value="recent">Plus récent</option>
            <option value="oldest">Plus ancien</option>
            <option value="progress">Progression</option>
          </select>
        </div>
        <p className={styles.filterNote}>
          La recherche, les filtres et le tri s'appliquent à l'ensemble de vos roadmaps.
        </p>
      </section>

      {isLoading ? (
        <div className={styles.grid} aria-label="Chargement des roadmaps" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => <RoadmapSkeleton key={index} />)}
        </div>
      ) : isError && items.length === 0 ? (
        <section className={styles.emptyState} role="alert">
          <Icon name="cloud_off" />
          <p>{errorMessage}</p>
          <Button variant="outline" onClick={() => void refetch()} isLoading={isFetching}>Réessayer</Button>
        </section>
      ) : total === 0 && !appliedSearch.trim() && statusFilter === "all" && categoryFilter === "all" ? (
        <section className={styles.emptyState}>
          <Icon name="route" />
          <h2>Aucune roadmap pour le moment</h2>
          <p>Les roadmaps que vous créerez apparaîtront ici.</p>
          <Button icon="add" onClick={() => navigate("/roadmaps/generate")}>
            Nouvelle roadmap
          </Button>
        </section>
      ) : total === 0 ? (
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
            {items.map((roadmap) => (
              <RoadmapCard
                key={roadmap.id}
                roadmap={roadmap}
                from={{ pathname: location.pathname, search: location.search, hash: location.hash }}
              />
            ))}
            <Link
              className={styles.createCard}
              to="/roadmaps/generate"
              state={{ from: { pathname: location.pathname, search: location.search, hash: location.hash } }}
              aria-label="Créer une nouvelle roadmap"
            >
              <span className={styles.createIcon}><Icon name="add" /></span>
              <strong>Nouvelle roadmap</strong>
              <span>Créer un nouveau parcours personnalisé.</span>
            </Link>
          </div>
          <div className={styles.listFooter}>
            <p>
              {items.length} résultat{items.length === 1 ? "" : "s"} affiché{items.length === 1 ? "" : "s"} sur {total}
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
