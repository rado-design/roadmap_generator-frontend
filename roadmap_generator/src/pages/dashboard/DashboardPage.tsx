import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AppLayout, PageHeader } from "../../app/layouts";
import { useDashboardRoadmaps, type DashboardRoadmap } from "../../features/dashboard";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import styles from "./DashboardPage.module.scss";

const metricTemplates = [
  { label: "Roadmaps terminées", icon: "task_alt", note: "Agrégat backend à créer" },
  { label: "Roadmaps en cours", icon: "pending_actions", note: "Agrégat backend à créer" },
  { label: "Taux de réussite", icon: "trending_up", note: "Métrique à définir côté backend" },
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

function TemplatePanel({ title, description }: { title: string; description: string }) {
  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.panelHeading}>
        <h2>{title}</h2>
        <span className={styles.templateBadge}>Gabarit · backend à compléter</span>
      </div>
      <p className={styles.templateCopy}>{description}</p>
      <div className={styles.templatePlaceholder} role="note">
        <Icon name="bar_chart" />
        <span>Visualisation à connecter</span>
      </div>
    </section>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardRoadmaps();
  const [searchQuery, setSearchQuery] = useState("");
  const roadmaps = data?.items ?? [];
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
        title="Bonjour"
        description="Retrouvez vos parcours récents et suivez votre progression."
      />

      <div className={styles.dataNotice} role="note">
        <Icon name="info" />
        <p>
          Les roadmaps récentes viennent de votre compte. Les statistiques et graphiques marqués
          « gabarit » seront branchés lorsque les données correspondantes seront disponibles côté
          backend.
        </p>
      </div>

      <section className={styles.metrics} aria-label="Indicateurs du tableau de bord">
        <article className={`${styles.metricCard} ${styles.liveMetric}`}>
          <div className={styles.metricTopline}>
            <span>Total des roadmaps</span>
            <Icon name="route" />
          </div>
          {isLoading ? (
            <span className={styles.metricSkeleton} aria-label="Chargement" />
          ) : isError ? (
            <span className={styles.metricValue}>—</span>
          ) : (
            <span className={styles.metricValue}>{data?.total ?? 0}</span>
          )}
          <span className={styles.metricFootnote}>Nombre fourni par votre compte</span>
        </article>
        {metricTemplates.map(({ label, icon, note }) => (
          <article className={styles.metricCard} key={label}>
            <div className={styles.metricTopline}>
              <span>{label}</span>
              <Icon name={icon} />
            </div>
            <span className={styles.metricValue} aria-label="Donnée à venir">
              —
            </span>
            <span className={styles.metricFootnote}>{note}</span>
          </article>
        ))}
      </section>

      <section className={styles.analysisGrid} aria-label="Analyses">
        <TemplatePanel
          title="Roadmaps par catégorie"
          description="La répartition apparaîtra quand l’API exposera la catégorie et son agrégat."
        />
        <TemplatePanel
          title="État des roadmaps"
          description="Le backend doit définir les états métier et fournir leur répartition."
        />
      </section>

      <section className={styles.roadmapsSection} aria-labelledby="recent-roadmaps-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="recent-roadmaps-title">Roadmaps récentes</h2>
            <p>Trois dernières affichées; la recherche filtre jusqu’aux 100 plus récentes.</p>
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
