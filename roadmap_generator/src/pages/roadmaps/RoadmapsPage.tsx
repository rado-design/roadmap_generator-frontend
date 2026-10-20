import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { AppLayout, PageHeader } from "../../app/layouts";
import { ROADMAPS_PAGE_SIZE, useRoadmaps, type RoadmapStatus, type RoadmapSummary } from "../../features/roadmaps";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import styles from "./RoadmapsPage.module.scss";

type SortOrder = "recent" | "oldest" | "progress";
const EMPTY_ROADMAPS: RoadmapSummary[] = [];

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
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RoadmapStatus>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const { data, isLoading, isError, error, refetch, isFetching } = useRoadmaps(offset);
  const items = data?.items ?? EMPTY_ROADMAPS;
  const filteredRoadmaps = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("fr");
    const filtered = items.filter((roadmap) => {
      const matchesQuery = !query || `${roadmap.title} ${roadmap.goal}`
        .toLocaleLowerCase("fr").includes(query);
      return matchesQuery && (statusFilter === "all" || roadmap.status === statusFilter);
    });

    return filtered.sort((left, right) => {
      if (sortOrder === "oldest") {
        return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
      }
      if (sortOrder === "progress") return getProgress(right) - getProgress(left);
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
  }, [items, searchQuery, sortOrder, statusFilter]);
  const pageCount = Math.ceil((data?.total ?? 0) / ROADMAPS_PAGE_SIZE);
  const currentPage = Math.floor(offset / ROADMAPS_PAGE_SIZE) + 1;
  const problemDetail = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
    : undefined;
  const errorMessage = typeof problemDetail === "string"
    ? problemDetail
    : "Impossible de charger vos roadmaps. Vérifiez votre connexion puis réessayez.";

  return (
    <AppLayout onSearch={setSearchQuery}>
      <PageHeader
        title="Toutes les roadmaps"
        description="Gérez et suivez l'avancement de vos projets stratégiques."
        actions={(
          <div className={styles.headerActions}>
            <Button variant="outline" disabled title="L'export sera ajouté dans une prochaine étape.">
              Exporter
            </Button>
            <Button disabled icon="add" title="La page de génération sera intégrée dans une prochaine étape.">
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
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className={styles.filterField}>
          <label htmlFor="roadmap-category">Catégorie</label>
          <select id="roadmap-category" disabled title="La catégorie n'est pas encore fournie par l'API.">
            <option>Catégories à connecter au backend</option>
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
          <select id="roadmap-sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
            <option value="recent">Plus récent</option>
            <option value="oldest">Plus ancien</option>
            <option value="progress">Progression</option>
          </select>
        </div>
        <p className={styles.filterNote}>
          La recherche, le statut et le tri s'appliquent aux roadmaps de la page chargée. La recherche globale et les catégories nécessitent une évolution de l'API.
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
      ) : data?.total === 0 ? (
        <section className={styles.emptyState}>
          <Icon name="route" />
          <h2>Aucune roadmap pour le moment</h2>
          <p>Les roadmaps que vous créerez apparaîtront ici.</p>
        </section>
      ) : filteredRoadmaps.length === 0 ? (
        <section className={styles.emptyState}>
          <Icon name="search_off" />
          <h2>Aucun résultat sur cette page</h2>
          <p>Modifiez la recherche ou les filtres, ou parcourez une autre page.</p>
          <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
            Effacer les filtres
          </Button>
        </section>
      ) : (
        <>
          <div className={styles.grid}>
            {filteredRoadmaps.map((roadmap) => (
              <RoadmapCard
                key={roadmap.id}
                roadmap={roadmap}
                from={{ pathname: location.pathname, search: location.search, hash: location.hash }}
              />
            ))}
            <div className={styles.createCard} aria-label="Création de roadmap à venir">
              <span className={styles.createIcon}><Icon name="add" /></span>
              <strong>Nouvelle roadmap</strong>
              <span>La création sera disponible après l'intégration de sa page.</span>
            </div>
          </div>
          <div className={styles.listFooter}>
            <p>
              {filteredRoadmaps.length} affichée{filteredRoadmaps.length === 1 ? "" : "s"} sur {items.length} de cette page · {data?.total ?? 0} au total
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
