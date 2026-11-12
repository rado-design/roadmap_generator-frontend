import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router";
import { AppLayout } from "../../app/layouts";
import { getLearnerProfile } from "../../features/users";
import {
  useCategoryCatalog,
  type GenerateRoadmapRequest,
  type LearnerLevel,
  type RoadmapCategory,
} from "../../features/roadmaps";
import { useRoadmapGenerationStore } from "../../features/roadmaps/hooks/useRoadmapGenerationStore";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import styles from "./GenerateRoadmapPage.module.scss";

const levels: { value: LearnerLevel; label: string }[] = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
  { value: "none", label: "Je ne sais pas" },
];

const deadlines = [
  { value: "4", label: "1 mois" },
  { value: "12", label: "3 mois" },
  { value: "26", label: "6 mois" },
  { value: "52", label: "1 an" },
  { value: "none", label: "Pas de limite" },
];

const formSteps = [
  { id: "goal", title: "Votre objectif" },
  { id: "category", title: "Domaine d’apprentissage" },
  { id: "weekly-hours", title: "Temps disponible" },
  { id: "deadline", title: "Durée prévue" },
  { id: "level", title: "Votre niveau" },
  { id: "background", title: "Contexte complémentaire" },
] as const;

function CancelGenerationConfirmDialog({ open, isLoading, error, onConfirm, onCancel }: {
  open: boolean;
  isLoading: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => { if (dialog.open) dialog.close(); };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.cancelDialog}
      aria-labelledby={`${dialogId}-title`}
      aria-describedby={`${dialogId}-description`}
      aria-busy={isLoading}
      onCancel={(event) => { event.preventDefault(); if (!isLoading) onCancel(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !isLoading) onCancel(); }}
    >
      <div className={styles.cancelDialogContent}>
        <span className={styles.cancelDialogIcon} aria-hidden="true"><Icon name="stop_circle" /></span>
        <h2 id={`${dialogId}-title`}>Arrêter la génération ?</h2>
        <p id={`${dialogId}-description`}>La tâche sera arrêtée et aucune roadmap ne sera créée. Vos paramètres resteront dans le formulaire.</p>
        {error ? <p className={styles.cancelDialogError} role="alert">{error}</p> : null}
        <div className={styles.cancelDialogActions}>
          <Button type="button" variant="outline" disabled={isLoading} onClick={onCancel}>Continuer la génération</Button>
          <Button type="button" isLoading={isLoading} disabled={isLoading} onClick={onConfirm}>Arrêter la génération</Button>
        </div>
      </div>
    </dialog>
  );
}

export function GenerateRoadmapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationFrom = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
  const returnFrom = navigationFrom?.pathname
    ? { pathname: navigationFrom.pathname, search: navigationFrom.search ?? "", hash: navigationFrom.hash ?? "" }
    : { pathname: "/roadmaps/generate" };
  const learnerProfileQuery = useQuery({
    queryKey: ["users", "me", "learner-profile"],
    queryFn: getLearnerProfile,
  });
  const generation = useRoadmapGenerationStore();
  const isPending = generation.status === "connecting" || generation.status === "streaming";
  const generationStarted = generation.started || generation.status === "connecting" || generation.status === "complete";
  const streamError = generation.status === "failed" ? generation.error : undefined;
  const streamTitle = generation.title;
  const streamSteps = generation.steps;
  const streamAttempt = generation.attempt;
  const mountedRef = useRef(false);
  const [goal, setGoal] = useState(() => generation.request?.goal ?? "");
  const [category, setCategory] = useState<RoadmapCategory>(() => generation.request?.category ?? "programming");
  const categoryCatalog = useCategoryCatalog();
  const wizardHeadingRef = useRef<HTMLHeadingElement>(null);
  const [weeklyHours, setWeeklyHours] = useState(() => String(generation.request?.weekly_hours ?? 5));
  const [deadlineWeeks, setDeadlineWeeks] = useState(() => generation.request?.deadline_weeks == null ? "none" : String(generation.request.deadline_weeks));
  const [level, setLevel] = useState<LearnerLevel>(() => generation.request?.level ?? "beginner");
  const [background, setBackground] = useState(() => generation.request?.background ?? "");
  const [activeFormStep, setActiveFormStep] = useState(0);
  const [validationError, setValidationError] = useState<string>();
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string>();

  useEffect(() => {
    const options = categoryCatalog.data?.items;
    if (options?.length && !options.some((option) => option.value === category)) {
      setCategory(options[0].value);
    }
  }, [category, categoryCatalog.data?.items]);

  useEffect(() => {
    if (activeFormStep > 0) wizardHeadingRef.current?.focus();
  }, [activeFormStep]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isPending && !isCancelling) setCancelConfirmOpen(false);
  }, [isPending, isCancelling]);

  const startGeneration = async () => {
    setValidationError(undefined);

    if (goal.trim().length < 10 || goal.trim().length > 500) {
      setActiveFormStep(0);
      setValidationError("Décrivez un objectif concret en 10 à 500 caractères.");
      return;
    }
    const hours = Number(weeklyHours);
    if (!Number.isInteger(hours) || hours < 1 || hours > 80) {
      setActiveFormStep(2);
      setValidationError("Indiquez un nombre d'heures compris entre 1 et 80.");
      return;
    }

    const payload: GenerateRoadmapRequest = {
      goal: goal.trim(),
      category,
      level,
      weekly_hours: hours,
      deadline_weeks: deadlineWeeks === "none" ? null : Number(deadlineWeeks),
      background: background.trim() || null,
    };

    const roadmap = await generation.start(payload);
    if (roadmap && mountedRef.current) {
      navigate(`/roadmaps/${roadmap.id}`, {
        state: { from: returnFrom },
      });
    }
  };

  const advanceForm = () => {
    setValidationError(undefined);
    if (activeFormStep === 0 && (goal.trim().length < 10 || goal.trim().length > 500)) {
      setValidationError("Décrivez un objectif concret en 10 à 500 caractères.");
      return;
    }
    if (activeFormStep === 1 && (!categoryCatalog.data?.items.some((item) => item.value === category))) {
      setValidationError("Choisissez une catégorie pour continuer.");
      return;
    }
    if (activeFormStep === 2) {
      const hours = Number(weeklyHours);
      if (!Number.isInteger(hours) || hours < 1 || hours > 80) {
        setValidationError("Indiquez un nombre d'heures compris entre 1 et 80.");
        return;
      }
    }
    setActiveFormStep((current) => Math.min(current + 1, formSteps.length - 1));
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeFormStep < formSteps.length - 1) {
      advanceForm();
      return;
    }
    void startGeneration();
  };

  const returnToForm = () => {
    generation.returnToForm();
  };

  const cancelGeneration = async () => {
    setIsCancelling(true);
    setCancelError(undefined);
    try {
      await generation.cancel();
      setCancelConfirmOpen(false);
    } catch (error) {
      const message = typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "Impossible d'annuler la génération. Réessayez.";
      setCancelError(message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <AppLayout>
      <div className={styles.surface}>
        <div className={styles.page}>
          <Link className={styles.backLink} to={navigationFrom?.pathname ? returnFrom : "/roadmaps"}>
            <Icon name="arrow_back" />
            Retour aux roadmaps
          </Link>

        <header className={styles.intro}>
          <h1>Générez votre prochaine étape</h1>
          <p>Transformez vos idées complexes en trajectoires claires et actionnables grâce à notre moteur d'IA spécialisé.</p>
        </header>

        {generationStarted ? (
          <section className={styles.generationProgress} aria-labelledby="generation-progress-title" aria-live="polite">
            <div className={styles.generationHeading}>
              <span className={styles.generationIndicator} aria-hidden="true" />
              <div>
                <h2 id="generation-progress-title">
                  {streamError
                    ? "La génération a rencontré un problème"
                    : generation.status === "complete"
                      ? "Roadmap générée"
                      : streamTitle ?? "Votre roadmap se construit"}
                </h2>
                <p>
                  {streamError
                    ? "La génération n'a pas abouti. Vos paramètres sont conservés."
                    : generation.status === "complete"
                      ? "Votre roadmap est prête. Vous pouvez la consulter maintenant."
                      : `Les étapes apparaissent au fil de la génération${streamAttempt > 1 ? ` · nouvelle tentative ${streamAttempt}` : ""}.`}
                </p>
              </div>
            </div>

            {streamError ? (
              <div className={styles.error} role="alert">
                <Icon name="error" />
                <span>{streamError}</span>
              </div>
            ) : generation.status === "complete" ? (
              <div className={styles.streamStatus} role="status">
                <Icon name="check_circle" />
                <span>La génération est terminée.</span>
              </div>
            ) : (
              <div className={styles.streamStatus} role="status">
                <span className={styles.streamPulse} aria-hidden="true" />
                <span>{streamSteps.length} {streamSteps.length === 1 ? "étape reçue" : "étapes reçues"} · génération en cours</span>
              </div>
            )}

            {streamSteps.length > 0 ? (
              <ol className={styles.generatedSteps}>
                {streamSteps.map((step) => (
                  <li className={styles.generatedStep} key={step.order}>
                    <div className={styles.generatedStepMarker}>{step.order}</div>
                    <div className={styles.generatedStepContent}>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                      {step.learning_objectives.length > 0 ? (
                        <ul>
                          {step.learning_objectives.map((objective) => <li key={objective}>{objective}</li>)}
                        </ul>
                      ) : null}
                      {step.resources === null ? (
                        <p className={styles.generatedResourcesPending}>
                          {generation.status === "failed" ? "La recherche de ressources a été interrompue." : "Recherche des ressources de cette étape…"}
                        </p>
                      ) : step.resources.length > 0 ? (
                        <div className={styles.generatedResources}>
                          <strong>Ressources</strong>
                          <ul>
                            {step.resources.map((resource, index) => (
                              <li key={`${resource.url ?? resource.title}-${index}`}>
                                {resource.url ? (
                                  <a href={resource.url} target="_blank" rel="noreferrer">{resource.title}</a>
                                ) : resource.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : !streamError ? (
              <p className={styles.waitingForFirstStep}>En attente de la première étape valide…</p>
            ) : null}

            {streamError ? (
              <div className={styles.progressActions}>
                <Button variant="outline" onClick={returnToForm}>Modifier les paramètres</Button>
              </div>
            ) : null}
            {generation.status === "complete" && generation.result ? (
              <div className={styles.progressActions}>
                <Button onClick={() => navigate(`/roadmaps/${generation.result?.id}`, { state: { from: returnFrom } })} icon="arrow_forward">
                  Consulter la roadmap
                </Button>
              </div>
            ) : null}
            {isPending ? (
              <div className={styles.cancelGenerationAction}>
                <Button
                  variant="outline"
                  icon="stop_circle"
                  disabled={!generation.generationId || isCancelling}
                  onClick={() => { setCancelError(undefined); setCancelConfirmOpen(true); }}
                >
                  Annuler la génération
                </Button>
              </div>
            ) : null}
            {cancelError && !cancelConfirmOpen ? <p className={styles.cancelError} role="alert">{cancelError}</p> : null}
          </section>
        ) : (
        <div className={styles.columns}>
          <form className={styles.form} onSubmit={handleFormSubmit}>
            <div className={styles.wizardProgress} aria-label={`Étape ${activeFormStep + 1} sur ${formSteps.length}`}>
              <div className={styles.wizardProgressLabel}>
                <span>Étape {activeFormStep + 1} sur {formSteps.length}</span>
                <strong>{formSteps[activeFormStep].title}</strong>
              </div>
              <progress className={styles.wizardProgressTrack} aria-label="Progression du formulaire" max={formSteps.length} value={activeFormStep + 1} />
            </div>

            <div className={styles.wizardStep} key={formSteps[activeFormStep].id}>
              <h2 className={styles.wizardStepTitle} ref={wizardHeadingRef} tabIndex={-1}>{formSteps[activeFormStep].title}</h2>
              {activeFormStep === 0 ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="roadmap-goal">Quel est votre objectif ou sujet ?</label>
                  <input id="roadmap-goal" className={styles.input} value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Ex. : Lancer un produit SaaS en 3 mois" minLength={10} maxLength={500} autoFocus />
                  <p className={styles.helper}>Décrivez un objectif concret en 10 à 500 caractères.</p>
                </div>
              ) : null}

              {activeFormStep === 1 ? (
                <fieldset className={styles.fieldset}>
                  <legend className={styles.label}>Dans quel domaine souhaitez-vous progresser ?</legend>
                  {categoryCatalog.isLoading ? <p className={styles.helper}>Chargement des catégories…</p> : null}
                  {categoryCatalog.isError ? <p className={styles.helper} role="alert">Impossible de charger les catégories. Réessayez avant de continuer.</p> : null}
                  <div className={styles.categoryGroups}>
                    {categoryCatalog.data?.groups.map((group) => {
                      const groupItems = categoryCatalog.data.items.filter((item) => item.group === group.value);
                      if (!groupItems.length) return null;
                      return (
                        <details className={styles.categoryGroup} key={group.value} name="roadmap-category-groups" open={groupItems.some((item) => item.value === category)}>
                          <summary>{group.label}<span>{groupItems.length}</span></summary>
                          <div className={styles.choices} role="radiogroup" aria-label={group.label}>
                            {groupItems.map((item) => (
                              <label className={`${styles.choice} ${category === item.value ? styles.selected : ""}`} key={item.value}>
                                <input type="radio" name="roadmap-category" value={item.value} checked={category === item.value} onChange={() => setCategory(item.value)} />
                                {item.label}
                              </label>
                            ))}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}

              {activeFormStep === 2 ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="weekly-hours">Combien d'heures pouvez-vous consacrer par semaine ?</label>
                  <div className={styles.hoursControl}>
                    <input id="weekly-hours" className={styles.input} type="number" min={1} max={80} step={1} value={weeklyHours} onChange={(event) => setWeeklyHours(event.target.value)} required autoFocus />
                    <span>heures</span>
                  </div>
                  <p className={styles.helper}>Un rythme réaliste vaut mieux qu'un rythme idéal. De 1 à 80 heures.</p>
                </div>
              ) : null}

              {activeFormStep === 3 ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="deadline">Quand souhaitez-vous atteindre cet objectif ?</label>
                  <select id="deadline" className={styles.input} value={deadlineWeeks} onChange={(event) => setDeadlineWeeks(event.target.value)} autoFocus>
                    {deadlines.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <p className={styles.helper}>L'IA ajuste le nombre et la taille des étapes selon votre échéance.</p>
                </div>
              ) : null}

              {activeFormStep === 4 ? (
                <fieldset className={styles.fieldset}>
                  <legend className={styles.label}>Quel est votre niveau actuel sur ce sujet ?</legend>
                  <div className={styles.choices}>
                    {levels.map((item) => (
                      <label className={`${styles.choice} ${level === item.value ? styles.selected : ""}`} key={item.value}>
                        <input type="radio" name="learner-level" value={item.value} checked={level === item.value} onChange={() => setLevel(item.value)} />
                        {item.label}
                      </label>
                    ))}
                  </div>
                  <p className={styles.helper}>Vous pourrez ajuster votre parcours au fil de votre progression.</p>
                </fieldset>
              ) : null}

              {activeFormStep === 5 ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="background">Avez-vous un contexte à préciser ? <span>(facultatif)</span></label>
                  <textarea id="background" className={`${styles.input} ${styles.textarea}`} rows={4} maxLength={500} value={background} onChange={(event) => setBackground(event.target.value)} placeholder="Précisez votre expérience ou vos contraintes particulières…" autoFocus />
                  <p className={styles.helper}>Ces précisions aident à personnaliser le parcours. 500 caractères maximum.</p>
                </div>
              ) : null}
            </div>

            {validationError || generation.error ? (
              <div className={styles.error} role="alert">
                <Icon name="error" />
                <span>{validationError ?? generation.error}</span>
              </div>
            ) : null}

            <div className={styles.formActions}>
              <div className={styles.wizardActions}>
                {activeFormStep > 0 ? <Button type="button" variant="outline" icon="arrow_back" onClick={() => { setValidationError(undefined); setActiveFormStep((current) => Math.max(current - 1, 0)); }}>Précédent</Button> : <span />}
                {activeFormStep < formSteps.length - 1 ? (
                  <Button type="button" icon="arrow_forward" disabled={activeFormStep === 1 && (categoryCatalog.isLoading || categoryCatalog.isError || !categoryCatalog.data?.items.length)} onClick={advanceForm}>Continuer</Button>
                ) : (
                  <Button type="submit" isLoading={isPending} disabled={isPending || categoryCatalog.isError} icon="auto_awesome">Générer la roadmap</Button>
                )}
              </div>
              {isPending ? <p role="status">Connexion au flux de génération… Les étapes apparaîtront dès la première réponse valide.</p> : null}
            </div>
          </form>

          <aside className={styles.aside}>
            <section className={styles.learnerProfile} aria-labelledby="learner-profile-title">
              <div className={styles.learnerProfileHeading}>
                <Icon name="person" />
                <h2 id="learner-profile-title">
                  {learnerProfileQuery.isSuccess && learnerProfileQuery.data.is_configured
                    ? "Profil d’apprenant configuré"
                    : learnerProfileQuery.isSuccess
                      ? "Personnalisez votre profil d’apprenant"
                      : "Profil d’apprenant"}
                </h2>
              </div>
              <p>
                {learnerProfileQuery.isSuccess && learnerProfileQuery.data.is_configured
                  ? "Vos préférences de langue, de rythme et de style sont prises en compte pour générer vos roadmaps."
                  : learnerProfileQuery.isSuccess
                    ? "Configurez vos préférences pour adapter les prochaines roadmaps à votre façon d’apprendre."
                    : "Vérifiez vos préférences pour adapter les prochaines roadmaps à votre façon d’apprendre."}
              </p>
              <Link to="/settings">
                {learnerProfileQuery.isSuccess && learnerProfileQuery.data.is_configured
                  ? "Modifier mon profil"
                  : "Configurer mon profil"}
                <Icon name="arrow_forward" />
              </Link>
            </section>

            <section className={styles.howItWorks} aria-labelledby="how-it-works-title">
              <h2 id="how-it-works-title">Comment ça marche ?</h2>
              <ol>
                <li>
                  <span aria-hidden="true" />
                  <div><strong>Définissez l'objectif</strong><p>Soyez aussi précis que possible pour obtenir un parcours pertinent.</p></div>
                </li>
                <li>
                  <span aria-hidden="true" />
                  <div><strong>Choisissez les domaines</strong><p>Sélectionnez la catégorie et le rythme adaptés à votre projet.</p></div>
                </li>
                <li>
                  <span aria-hidden="true" />
                  <div><strong>Laissez l'IA structurer le parcours</strong><p>Les étapes apparaissent progressivement pendant la génération.</p></div>
                </li>
              </ol>
            </section>

            <section className={styles.inspiration} aria-labelledby="inspiration-title">
              <h2 id="inspiration-title">Exemple</h2>
              <p>« Apprendre le développement mobile avec Flutter en 6 mois »</p>
              <button
                type="button"
                onClick={() => {
                  setGoal("Apprendre le développement mobile avec Flutter en 6 mois");
                  setCategory(categoryCatalog.data?.items[0]?.value ?? "programming");
                }}
                disabled={isPending}
              >
                Essayer cet exemple <Icon name="arrow_forward" />
              </button>
            </section>
          </aside>
        </div>
        )}
        </div>
      </div>
      <CancelGenerationConfirmDialog
        open={cancelConfirmOpen}
        isLoading={isCancelling}
        error={cancelError}
        onConfirm={() => void cancelGeneration()}
        onCancel={() => { if (!isCancelling) setCancelConfirmOpen(false); }}
      />
    </AppLayout>
  );
}
