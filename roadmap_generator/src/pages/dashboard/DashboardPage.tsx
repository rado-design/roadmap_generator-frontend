import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { AppLayout, PageHeader } from "../../app/layouts";
import { useDashboardRoadmaps, type DashboardDistributionItem, type DashboardRoadmap } from "../../features/dashboard";
import { useRoadmapGenerationStore } from "../../features/roadmaps/hooks/useRoadmapGenerationStore";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import styles from "./DashboardPage.module.scss";

const categoryLabels: Record<string, string> = {
  tech: "Technologie", languages: "Langues", sciences: "Sciences", business: "Business",
  creative: "Création", trades: "Métiers", life: "Vie pratique", hobbies: "Loisirs", other: "Autre",
};
const statusLabels: Record<string, string> = { completed: "Terminées", in_progress: "En cours", not_started: "À commencer" };
const EMPTY_ROADMAPS: DashboardRoadmap[] = [];
const statusColors: Record<string, string> = { completed: "#006c49", in_progress: "#006591", not_started: "#586377" };

function getProgress(roadmap: DashboardRoadmap) {
  if (roadmap.total_steps === 0) return 0;
  return Math.min(100, Math.round((roadmap.completed_steps / roadmap.total_steps) * 100));
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function CompletionPanel({ rate, completed, total, isLoading, isError }: {
  rate: number | null | undefined; completed: number; total: number; isLoading: boolean; isError: boolean;
}) {
  const percent = rate == null ? 0 : Math.max(0, Math.min(rate, 100));
  const circumference = Math.PI * 90;
  const dashOffset = circumference * (1 - percent / 100);
  return (
    <section className={`${styles.panel} ${styles.completionPanel}`} aria-label="Taux de roadmaps terminées">
      <h2>Progression globale</h2>
      <p className={styles.panelHint}>Roadmaps terminées</p>
      {isLoading ? <span className={styles.gaugeSkeleton} aria-label="Chargement" /> : isError ? <p className={styles.gaugeUnavailable}>Données indisponibles</p> : (
        <div className={styles.gaugeWrap}>
          <svg className={styles.gauge} viewBox="0 0 220 125" role="img" aria-label={`${rate ?? 0} % de roadmaps terminées`}>
            <path className={styles.gaugeTrack} d="M 20 110 A 90 90 0 0 1 200 110" />
            <path className={styles.gaugeValue} d="M 20 110 A 90 90 0 0 1 200 110" pathLength={circumference} style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }} />
            <text className={styles.gaugePercent} x="110" y="82" textAnchor="middle">{rate == null ? "—" : `${rate}%`}</text>
          </svg>
          <p className={styles.gaugeCaption}>{completed} / {total} terminée{completed === 1 ? "" : "s"}</p>
          {completed === 0 && <p className={styles.starterNote}><Icon name="auto_awesome" />Chaque grand projet commence par un premier pas.</p>}
        </div>
      )}
    </section>
  );
}

function RoadmapCounts({ total, completed, inProgress, notStarted, isLoading, isError }: {
  total: number; completed: number; inProgress: number; notStarted: number; isLoading: boolean; isError: boolean;
}) {
  const counts = [
    { label: "Roadmaps prêtes", value: total, ratio: total > 0 ? 100 : 0, icon: "route", color: "blue" },
    { label: "Terminées", value: completed, ratio: total > 0 ? completed / total * 100 : 0, icon: "task_alt", color: "green" },
    { label: "En cours", value: inProgress, ratio: total > 0 ? inProgress / total * 100 : 0, icon: "pending_actions", color: "orange" },
    { label: "À commencer", value: notStarted, ratio: total > 0 ? notStarted / total * 100 : 0, icon: "radio_button_unchecked", color: "purple" },
  ];
  return (
    <section className={`${styles.panel} ${styles.countPanel}`} aria-label="Nombre de roadmaps par état">
      <h2>Vos roadmaps</h2>
      <div className={styles.countGrid}>
        {counts.map((item) => (
          <div className={styles.countItem} key={item.label}>
            <span className={`${styles.countIcon} ${styles[item.color]}`} aria-hidden="true"><Icon name={item.icon} /></span>
            <span className={styles.countLabel}>{item.label}</span>
            {isLoading ? <span className={styles.countSkeleton} /> : <span className={`${styles.countRing} ${styles[item.color]}`} style={{ "--ring-progress": `${isError ? 0 : item.ratio}%` } as CSSProperties} aria-label={`${isError ? "—" : item.value} ${item.label.toLocaleLowerCase("fr")}`}><strong>{isError ? "—" : item.value}</strong></span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function RecommendedActions({ roadmaps, isLoading, onCreate }: { roadmaps: DashboardRoadmap[]; isLoading: boolean; onCreate: () => void }) {
  const nextRoadmap = roadmaps.find((roadmap) => roadmap.status === "ready" && roadmap.completed_steps < roadmap.total_steps);
  const actions = [
    {
      title: nextRoadmap ? "Continuer votre roadmap" : roadmaps.length ? "Parcourir vos roadmaps" : "Créer votre premier parcours",
      description: nextRoadmap?.title ?? (roadmaps.length ? "Retrouvez tous vos parcours et leur progression." : "Générez un parcours personnalisé pour commencer."),
      icon: nextRoadmap ? "checklist" : roadmaps.length ? "route" : "add",
      to: nextRoadmap ? `/roadmaps/${nextRoadmap.id}` : roadmaps.length ? "/roadmaps" : "/roadmaps/generate",
    },
    { title: "Voir toutes les roadmaps", description: "Consultez vos parcours actifs et archivés.", icon: "route", to: "/roadmaps" },
    { title: "Créer une roadmap", description: "Générez un nouveau parcours personnalisé.", icon: "auto_awesome", to: "/roadmaps/generate" },
  ];
  return (
    <section className={`${styles.panel} ${styles.actionsPanel}`} aria-label="Prochaines actions recommandées">
      <h2>Prochaines actions recommandées</h2>
      <p className={styles.panelHint}>Ce qui vous fera avancer le plus vite.</p>
      {isLoading ? <div className={styles.actionSkeletons} aria-busy="true"><span /><span /><span /></div> : (
        <div className={styles.actionList}>
          {actions.map((action) => (
            <Link className={styles.actionItem} key={action.title} to={action.to} state={action.to === "/roadmaps/generate" ? { from: { pathname: "/dashboard", search: "", hash: "" } } : undefined} onClick={action.to === "/roadmaps/generate" ? onCreate : undefined}>
              <span className={styles.actionIcon}><Icon name={action.icon} /></span>
              <span className={styles.actionCopy}><strong>{action.title}</strong><span>{action.description}</span></span>
              <Icon name="chevron_right" className={styles.actionArrow} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function StatusDistributionPanel({ items, isLoading, onCreate }: { items: DashboardDistributionItem[]; isLoading: boolean; onCreate: () => void }) {
  return (
    <section className={`${styles.panel} ${styles.statusPanel}`} aria-label="État des roadmaps">
      <div className={styles.panelHeading}><h2>État des roadmaps</h2></div>
      {isLoading ? <p className={styles.distributionEmpty} aria-busy="true">Chargement…</p> : items.length ? (
        <ul className={styles.statusDistribution}>{items.map((item) => (
          <li key={item.key}>
            <div className={styles.statusMeta}><span>{statusLabels[item.key] ?? item.key} ({item.count})</span><span>{item.percent} %</span></div>
            <div className={styles.statusTrack} role="progressbar" aria-label={`Roadmaps ${statusLabels[item.key] ?? item.key}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.percent}><span style={{ width: `${item.percent}%`, backgroundColor: statusColors[item.key] ?? "#006591" }} /></div>
          </li>
        ))}</ul>
      ) : <p className={styles.distributionEmpty}>Aucune donnée à afficher.</p>}
      <Link className={styles.createLink} to="/roadmaps/generate" state={{ from: { pathname: "/dashboard", search: "", hash: "" } }} onClick={onCreate}><Icon name="add" />Créer une roadmap</Link>
    </section>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardRoadmaps();
  const generation = useRoadmapGenerationStore();
  const [searchQuery, setSearchQuery] = useState("");
  const roadmaps = data?.recent_roadmaps ?? EMPTY_ROADMAPS;
  const filteredRoadmaps = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("fr");
    if (!query) return roadmaps;
    return roadmaps.filter((roadmap) => `${roadmap.title} ${roadmap.goal}`.toLocaleLowerCase("fr").includes(query));
  }, [roadmaps, searchQuery]);
  const errorMessage = typeof error === "object" && error !== null && "message" in error ? String(error.message) : "Impossible de charger vos roadmaps pour le moment.";
  const total = data?.roadmaps.total ?? 0;
  const completed = data?.roadmaps.completed ?? 0;
  const displayName = data?.user.display_name?.trim()?.split(/\s+/)[0];
  const nextRoadmap = roadmaps.find((roadmap) => roadmap.status === "ready" && roadmap.completed_steps < roadmap.total_steps);

  return (
    <AppLayout onSearch={setSearchQuery}>
      <PageHeader title="Tableau de bord" description="Suivez vos parcours et retrouvez rapidement vos roadmaps récentes." />

      <section className={styles.welcomeBanner} aria-label="Bienvenue">
        <span className={styles.welcomeIcon} aria-hidden="true"><Icon name="waving_hand" /></span>
        <div><p className={styles.welcomeTitle}>{displayName ? `Bonjour ${displayName} !` : "Bienvenue !"}</p><p>{total === 0 ? "Créez votre premier parcours et commencez à apprendre à votre rythme." : `${completed} roadmap${completed === 1 ? " terminée" : "s terminées"} sur ${total}. Continuez à avancer à votre rythme.`}</p></div>
        {total > 0 && <Link className={styles.welcomeAction} to={nextRoadmap ? `/roadmaps/${nextRoadmap.id}` : "/roadmaps"}>Continuer <Icon name="arrow_forward" /></Link>}
      </section>

      <div className={styles.dashboardGrid}>
        <section className={styles.overviewGrid} aria-label="Vue d’ensemble">
          <CompletionPanel rate={data?.completion_rate} completed={completed} total={total} isLoading={isLoading} isError={isError} />
          <RoadmapCounts total={total} completed={completed} inProgress={data?.roadmaps.in_progress ?? 0} notStarted={data?.roadmaps.not_started ?? 0} isLoading={isLoading} isError={isError} />
        </section>
        <RecommendedActions roadmaps={roadmaps} isLoading={isLoading} onCreate={() => generation.startNew()} />
        <section className={`${styles.panel} ${styles.recentPanel}`} aria-labelledby="recent-roadmaps-title">
          <div className={styles.sectionHeading}>
            <div><h2 id="recent-roadmaps-title">Roadmaps récentes</h2><p>Vos cinq parcours prêts les plus récents.</p></div>
            <Link to="/roadmaps" className={styles.allRoadmapsLink}>Toutes les roadmaps <Icon name="arrow_forward" /></Link>
          </div>
          {isLoading ? <div className={styles.loadingRows} aria-label="Chargement des roadmaps" aria-busy="true">{[0, 1, 2, 3, 4].map((item) => <span key={item} />)}</div> : isError ? (
            <div className={styles.statePanel} role="alert"><Icon name="cloud_off" /><p>{errorMessage}</p><Button variant="outline" onClick={() => void refetch()} isLoading={isFetching}>Réessayer</Button></div>
          ) : filteredRoadmaps.length > 0 ? (
            <div className={styles.tableWrap}><table className={styles.roadmapTable}><thead><tr><th scope="col">Roadmap</th><th scope="col">Étapes</th><th scope="col">Progression</th><th scope="col">Créée le</th><th scope="col"><span className={styles.visuallyHidden}>Ouvrir</span></th></tr></thead><tbody>
              {filteredRoadmaps.map((roadmap) => {
                const progress = getProgress(roadmap);
                return <tr key={roadmap.id}><td><Link to={`/roadmaps/${roadmap.id}`} state={{ from: { pathname: "/dashboard" } }} className={styles.tableRoadmapLink}><strong>{roadmap.title}</strong><span>{categoryLabels[roadmap.category] ?? roadmap.category}{roadmap.goal ? ` · ${roadmap.goal}` : ""}</span></Link></td><td>{roadmap.completed_steps} / {roadmap.total_steps}</td><td><div className={styles.tableProgress}><span role="progressbar" aria-label={`Progression de ${roadmap.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{ width: `${progress}%` }} /></span><b>{progress}%</b></div></td><td>{formatDate(roadmap.created_at)}</td><td><Link to={`/roadmaps/${roadmap.id}`} state={{ from: { pathname: "/dashboard" } }} className={styles.openLink} aria-label={`Ouvrir ${roadmap.title}`}><Icon name="chevron_right" /></Link></td></tr>;
              })}
            </tbody></table></div>
          ) : <div className={styles.emptyState}><Icon name={searchQuery ? "search_off" : "route"} /><p>{searchQuery ? "Aucune roadmap récente ne correspond à cette recherche." : "Aucune roadmap prête pour le moment. Créez votre premier parcours."}</p>{!searchQuery && <Link className={styles.createLink} to="/roadmaps/generate" state={{ from: { pathname: "/dashboard", search: "", hash: "" } }} onClick={() => generation.startNew()}><Icon name="add" />Créer une roadmap</Link>}</div>}
        </section>
        <StatusDistributionPanel items={data?.status_distribution ?? []} isLoading={isLoading} onCreate={() => generation.startNew()} />
      </div>
    </AppLayout>
  );
}
