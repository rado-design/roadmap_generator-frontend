import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AppLayout, PageHeader } from "../../app/layouts";
import { ROADMAPS_PAGE_SIZE, useRoadmaps, type RoadmapCategoryGroup, type RoadmapSort, type RoadmapStatus, type RoadmapSummary } from "../../features/roadmaps";
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
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RoadmapStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | RoadmapCategoryGroup>("all");
  const [sortOrder, setSortOrder] = useState<RoadmapSort>("recent");
  const [appliedSearch, setAppliedSearch] = useState("");
  useEffect(() => {
    const timeout = window.setTimeout(() => setAppliedSearch(searchQuery.slice(0, 100)), 250);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);
  const { data, isLoading, isError, error, refetch, isFetching } = useRoadmaps({
    offset,
    search: appliedSearch,
    status: statusFilter,
    category: categoryFilter,
    sort: sortOrder,
  });
  const items = data?.items ?? EMPTY_ROADMAPS;
  const pageCount = Math.ceil((data?.total ?? 0) / ROADMAPS_PAGE_SIZE);
  const currentPage = Math.floor(offset / ROADMAPS_PAGE_SIZE) + 1;
  const problemDetail = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
    : undefined;
  const errorMessage = typeof problemDetail === "string"
    ? problemDetail
    : "Impossible de charger vos roadmaps. Vérifiez votre connexion puis réessayez.";

  return (
    <AppLayout onSearch={(query) => { setSearchQuery(query.slice(0, 100)); setOffset(0); }}>
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
            onChange={(event) => { setSearchQuery(event.target.value); setOffset(0); }}
          />
        </div>
        <div className={styles.filterField}>
          <label htmlFor="roadmap-category">Catégorie</label>
          <select
            id="roadmap-category"
            value={categoryFilter}
            onChange={(event) => { setCategoryFilter(event.target.value as "all" | RoadmapCategoryGroup); setOffset(0); }}
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
            onChange={(event) => { setStatusFilter(event.target.value as "all" | RoadmapStatus); setOffset(0); }}
          >
            <option value="all">Tous les statuts</option>
            <option value="generating">Génération en cours</option>
            <option value="ready">Prête</option>
            <option value="failed">Échec de génération</option>
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="roadmap-sort">Trier par</label>
          <select id="roadmap-sort" value={sortOrder} onChange={(event) => { setSortOrder(event.target.value as RoadmapSort); setOffset(0); }}>
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
      ) : isError ? (
        <section className={styles.emptyState} role="alert">
          <Icon name="cloud_off" />
          <p>{errorMessage}</p>
          <Button variant="outline" onClick={() => void refetch()} isLoading={isFetching}>Réessayer</Button>
        </section>
      ) : data?.total === 0 && !appliedSearch.trim() && statusFilter === "all" && categoryFilter === "all" ? (
        <section className={styles.emptyState}>
          <Icon name="route" />
          <h2>Aucune roadmap pour le moment</h2>
          <p>Les roadmaps que vous créerez apparaîtront ici.</p>
          <Button icon="add" onClick={() => navigate("/roadmaps/generate")}>
            Nouvelle roadmap
          </Button>
        </section>
      ) : data?.total === 0 ? (
        <section className={styles.emptyState}>
          <Icon name="search_off" />
          <h2>Aucun résultat</h2>
          <p>Modifiez la recherche ou les filtres pour afficher des roadmaps.</p>
          <Button variant="outline" onClick={() => { setSearchQuery(""); setAppliedSearch(""); setStatusFilter("all"); setCategoryFilter("all"); setSortOrder("recent"); setOffset(0); }}>
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
              {items.length} résultat{items.length === 1 ? "" : "s"} affiché{items.length === 1 ? "" : "s"} sur {data?.total ?? 0}
            </p>
            <nav className={styles.pagination} aria-label="Pagination des roadmaps">
              <Button variant="outline" disabled={offset === 0 || isFetching} onClick={() => setOffset(Math.max(0, offset - ROADMAPS_PAGE_SIZE))}>
                Précédent
              </Button>
              <span>Page {currentPage} sur {pageCount}</span>
              <Button variant="outline" disabled={currentPage >= pageCount || isFetching} onClick={() => setOffset(offset + ROADMAPS_PAGE_SIZE)}>
                Suivant
              </Button>
            </nav>
          </div>
        </>
      )}
    </AppLayout>
  );
}
