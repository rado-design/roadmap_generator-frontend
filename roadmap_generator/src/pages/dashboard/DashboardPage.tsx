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
  { label: "Roadmaps terminées", icon: "task_alt", key: "completed" as const },
  { label: "Roadmaps en cours", icon: "pending_actions", key: "in_progress" as const },
  { label: "Taux de complétion", icon: "trending_up", key: "completion_rate" as const },
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

function DistributionPanel({
  title,
  items,
  labels,
  isLoading,
}: {
  title: string;
  items: DashboardDistributionItem[];
  labels: Record<string, string>;
  isLoading: boolean;
}) {
  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.panelHeading}>
        <h2>{title}</h2>
      </div>
      {isLoading ? (
        <p className={styles.distributionEmpty} aria-busy="true">Chargement…</p>
      ) : items.length ? (
        <ul className={styles.distributionList}>
          {items.map((item) => (
            <li className={styles.distributionItem} key={item.key}>
              <div className={styles.distributionMeta}>
                <span>{labels[item.key] ?? item.key}</span>
                <span>{item.count} · {item.percent} %</span>
              </div>
              <div className={styles.distributionTrack} aria-hidden="true">
                <span style={{ width: `${item.percent}%` }} />
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

      <div className={styles.dataNotice} role="note">
        <Icon name="info" />
        <p>
          Les indicateurs portent sur les roadmaps prêtes. Le taux de complétion correspond à la
          part des roadmaps terminées parmi celles-ci.
        </p>
      </div>

      <section className={styles.metrics} aria-label="Indicateurs du tableau de bord">
        <article className={`${styles.metricCard} ${styles.liveMetric}`}>
          <div className={styles.metricTopline}>
            <span>Roadmaps prêtes</span>
            <Icon name="route" />
          </div>
          {isLoading ? (
            <span className={styles.metricSkeleton} aria-label="Chargement" />
          ) : isError ? (
            <span className={styles.metricValue}>—</span>
          ) : (
            <span className={styles.metricValue}>{data?.roadmaps.total ?? 0}</span>
          )}
          <span className={styles.metricFootnote}>Nombre fourni par votre compte</span>
        </article>
        {metricLabels.map(({ label, icon, key }) => (
          <article className={styles.metricCard} key={label}>
            <div className={styles.metricTopline}>
              <span>{label}</span>
              <Icon name={icon} />
            </div>
            {isLoading ? <span className={styles.metricSkeleton} aria-label="Chargement" /> : isError ? (
              <span className={styles.metricValue}>—</span>
            ) : (
              <span className={styles.metricValue}>
                {key === "completion_rate"
                  ? data?.completion_rate == null ? "—" : `${data.completion_rate} %`
                  : data?.roadmaps[key] ?? 0}
              </span>
            )}
            <span className={styles.metricFootnote}>{key === "completion_rate" ? "Roadmaps terminées" : "Nombre fourni par votre compte"}</span>
          </article>
        ))}
      </section>

      <section className={styles.analysisGrid} aria-label="Analyses">
        <DistributionPanel
          title="Roadmaps par catégorie"
          items={data?.category_distribution ?? []}
          labels={categoryLabels}
          isLoading={isLoading}
        />
        <DistributionPanel
          title="État des roadmaps"
          items={data?.status_distribution ?? []}
          labels={statusLabels}
          isLoading={isLoading}
        />
      </section>

      <section className={styles.roadmapsSection} aria-labelledby="recent-roadmaps-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="recent-roadmaps-title">Roadmaps récentes</h2>
            <p>Les trois plus récentes parmi vos roadmaps prêtes.</p>
          </div>
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
                : "Vous n’avez pas encore de roadmap. Votre premier parcours apparaîtra ici."}
            </p>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
