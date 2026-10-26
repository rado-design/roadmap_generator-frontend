import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AppLayout, PageHeader } from "../../app/layouts";
import { useDashboardRoadmaps, type DashboardDistributionItem, type DashboardRoadmap } from "../../features/dashboard";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import styles from "./DashboardPage.module.scss";

const categoryLabels: Record<string, string> = {
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

const statusLabels: Record<string, string> = {
  completed: "Terminées",
  in_progress: "En cours",
  not_started: "Non commencées",
};
const EMPTY_ROADMAPS: DashboardRoadmap[] = [];

const metricLabels = [
  { label: "Roadmaps prêtes", icon: "route", key: "total" as const },
  { label: "Roadmaps terminées", icon: "task_alt", key: "completed" as const },
  { label: "En cours", icon: "pending_actions", key: "in_progress" as const },
];

function getProgress(roadmap: DashboardRoadmap) {
  if (roadmap.total_steps === 0) return 0;
  return Math.min(100, Math.round((roadmap.completed_steps / roadmap.total_steps) * 100));
}

function RoadmapCard({ roadmap }: { roadmap: DashboardRoadmap }) {
  const progress = getProgress(roadmap);

  return (
    <Link className={styles.roadmapCard} to={`/roadmaps/${roadmap.id}`} state={{ from: { pathname: "/dashboard" } }}>
      <div className={styles.roadmapTopline}>
        <span className={styles.roadmapIcon} aria-hidden="true">
          <Icon name="route" />
        </span>
        <span className={styles.stepCount}>
          {roadmap.total_steps === 0
            ? "Aucune étape"
            : `${roadmap.completed_steps} / ${roadmap.total_steps} étapes`}
        </span>
      </div>
      <h3 className={styles.roadmapTitle}>{roadmap.title}</h3>
      <p className={styles.roadmapGoal}>{roadmap.goal}</p>
      <div className={styles.progressMeta}>
        <span>Progression</span>
        <span>{progress} %</span>
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
    </Link>
  );
}

const categoryColors = ["#006591", "#006c49", "#586377"];
const statusColors: Record<string, string> = {
  completed: "#006c49",
  in_progress: "#006591",
  not_started: "#586377",
};

function CategoryDistributionPanel({ items, isLoading }: {
  items: DashboardDistributionItem[];
  isLoading: boolean;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const circumference = 2 * Math.PI * 50;
  let offset = 0;

  return (
    <section className={styles.panel} aria-label="Roadmaps par catégorie">
      <div className={styles.panelHeading}>
        <h2>Distribution par catégorie</h2>
      </div>
      {isLoading ? (
        <p className={styles.distributionEmpty} aria-busy="true">Chargement…</p>
      ) : total > 0 ? (
        <div className={styles.categoryChart}>
          <svg className={styles.donutChart} viewBox="0 0 120 120" role="img" aria-label={items.map((item) => `${categoryLabels[item.key] ?? item.key} ${item.percent} %`).join(", ")}>
            {items.filter((item) => item.count > 0).map((item, index) => {
              const segment = circumference * item.count / total;
              const segmentOffset = offset;
              offset += segment;
              return (
                <circle
                  key={item.key}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={categoryColors[index % categoryColors.length]}
                  strokeWidth="14"
                  strokeDasharray={`${segment} ${circumference - segment}`}
                  strokeDashoffset={-segmentOffset}
                  transform="rotate(-90 60 60)"
                />
              );
            })}
            <text className={styles.donutCaption} x="60" y="53" textAnchor="middle">Total</text>
            <text className={styles.donutTotal} x="60" y="73" textAnchor="middle">{total}</text>
          </svg>
          <ul className={styles.categoryLegend}>
            {items.map((item, index) => (
              <li key={item.key}>
                <i style={{ backgroundColor: categoryColors[index % categoryColors.length] }} aria-hidden="true" />
                <span>{categoryLabels[item.key] ?? item.key} ({item.percent} %)</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={styles.distributionEmpty}>Aucune donnée à afficher.</p>
      )}
    </section>
  );
}

function StatusDistributionPanel({ items, isLoading }: {
  items: DashboardDistributionItem[];
  isLoading: boolean;
}) {
  return (
    <section className={styles.panel} aria-label="État des roadmaps">
      <div className={styles.panelHeading}>
        <h2>État des roadmaps</h2>
      </div>
      {isLoading ? (
        <p className={styles.distributionEmpty} aria-busy="true">Chargement…</p>
      ) : items.length ? (
        <ul className={styles.statusDistribution}>
          {items.map((item) => (
            <li key={item.key}>
              <div className={styles.statusMeta}>
                <span>{statusLabels[item.key] ?? item.key} ({item.count})</span>
                <span>{item.percent} %</span>
              </div>
              <div className={styles.statusTrack} role="progressbar" aria-label={`Roadmaps ${statusLabels[item.key] ?? item.key}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.percent}>
                <span style={{ width: `${item.percent}%`, backgroundColor: statusColors[item.key] ?? "#006591" }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.distributionEmpty}>Aucune donnée à afficher.</p>
      )}
    </section>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardRoadmaps();
  const [searchQuery, setSearchQuery] = useState("");
  const roadmaps = data?.recent_roadmaps ?? EMPTY_ROADMAPS;
  const filteredRoadmaps = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("fr");
    if (!query) return roadmaps.slice(0, 3);
    return roadmaps.filter((roadmap) =>
      `${roadmap.title} ${roadmap.goal}`.toLocaleLowerCase("fr").includes(query),
    );
  }, [roadmaps, searchQuery]);
  const errorMessage =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "Impossible de charger vos roadmaps pour le moment.";

  return (
    <AppLayout onSearch={setSearchQuery}>
      <PageHeader
        title={data?.user.display_name ? `Bonjour, ${data.user.display_name}` : "Bonjour"}
        description="Retrouvez vos parcours récents et suivez votre progression."
      />

      <section className={styles.metrics} aria-label="Indicateurs du tableau de bord">
        {metricLabels.map(({ label, icon, key }) => (
          <article className={styles.metricCard} key={label}>
            <div className={styles.metricTopline}>
              <Icon name={icon} aria-hidden="true" />
              <span className={styles.metricLabel}>{label}</span>
            </div>
            {isLoading ? (
              <span className={styles.metricSkeleton} aria-label="Chargement" />
            ) : isError ? (
              <span className={styles.metricValue}>—</span>
            ) : (
              <span className={styles.metricValue}>
                {key === "total"
                  ? data?.roadmaps.total ?? 0
                  : data?.roadmaps[key] ?? 0}
              </span>
            )}
          </article>
        ))}
        <article className={styles.metricCard}>
          <div className={styles.metricTopline}>
            <Icon name="trending_up" aria-hidden="true" />
            <span className={styles.metricLabel}>Taux de complétion</span>
          </div>
          {isLoading ? (
            <span className={styles.metricSkeleton} aria-label="Chargement" />
          ) : isError ? (
            <span className={styles.metricValue}>—</span>
          ) : (
            <span className={styles.metricValue}>
              {data?.completion_rate == null ? "—" : `${data.completion_rate} %`}
            </span>
          )}
        </article>
      </section>

      <section className={styles.analysisGrid} aria-label="Analyses">
        <CategoryDistributionPanel items={data?.category_distribution ?? []} isLoading={isLoading} />
        <StatusDistributionPanel items={data?.status_distribution ?? []} isLoading={isLoading} />
      </section>

      <section className={styles.roadmapsSection} aria-labelledby="recent-roadmaps-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="recent-roadmaps-title">Roadmaps récentes</h2>
            <p>Les trois plus récentes parmi vos roadmaps prêtes.</p>
          </div>
          <Link to="/roadmaps" className={styles.allRoadmapsLink}>
            Toutes les roadmaps
            <Icon name="arrow_forward" />
          </Link>
        </div>

        {isLoading ? (
          <div className={styles.roadmapGrid} aria-label="Chargement des roadmaps" aria-busy="true">
            {[0, 1, 2].map((item) => (
              <div className={styles.roadmapSkeleton} key={item} />
            ))}
          </div>
        ) : isError ? (
          <div className={styles.statePanel} role="alert">
            <Icon name="cloud_off" />
            <p>{errorMessage}</p>
            <Button variant="outline" onClick={() => void refetch()} isLoading={isFetching}>
              Réessayer
            </Button>
          </div>
        ) : filteredRoadmaps.length > 0 ? (
          <div className={styles.roadmapGrid}>
            {filteredRoadmaps.map((roadmap) => (
              <RoadmapCard key={roadmap.id} roadmap={roadmap} />
            ))}
          </div>
        ) : (
          <div className={styles.statePanel}>
            <Icon name={searchQuery ? "search_off" : "route"} />
            <p>
              {searchQuery
                ? "Aucune roadmap récente ne correspond à cette recherche."
                : "Vous n'avez pas encore de roadmap. Votre premier parcours apparaîtra ici."}
            </p>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
