import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { AppLayout } from "../../app/layouts";
import { getLearnerProfile } from "../../features/users";
import {
  ROADMAP_CATEGORY_OPTIONS,
  useGenerateRoadmap,
  type GeneratedRoadmapStep,
  type GenerateRoadmapRequest,
  type LearnerLevel,
  type RoadmapCategory,
  type RoadmapGenerationEvent,
  type RoadmapResource,
} from "../../features/roadmaps";
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

interface PreviewStep extends GeneratedRoadmapStep {
  resources: RoadmapResource[];
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return "La génération a échoué. Vérifiez votre connexion puis réessayez.";
}

export function GenerateRoadmapPage() {
  const navigate = useNavigate();
  const learnerProfileQuery = useQuery({
    queryKey: ["users", "me", "learner-profile"],
    queryFn: getLearnerProfile,
  });
  const { mutateAsync, isPending, error, reset } = useGenerateRoadmap();
  const controllerRef = useRef<AbortController | null>(null);
  const hasStartedStreamRef = useRef(false);
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState<RoadmapCategory>("programming");
  const [weeklyHours, setWeeklyHours] = useState("5");
  const [deadlineWeeks, setDeadlineWeeks] = useState("12");
  const [level, setLevel] = useState<LearnerLevel>("beginner");
  const [background, setBackground] = useState("");
  const [validationError, setValidationError] = useState<string>();
  const [generationStarted, setGenerationStarted] = useState(false);
  const [streamTitle, setStreamTitle] = useState<string>();
  const [streamSteps, setStreamSteps] = useState<PreviewStep[]>([]);
  const [streamAttempt, setStreamAttempt] = useState(1);
  const [streamError, setStreamError] = useState<string>();

  useEffect(() => () => controllerRef.current?.abort(), []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(undefined);
    setStreamError(undefined);
    setGenerationStarted(false);
    hasStartedStreamRef.current = false;
    setStreamTitle(undefined);
    setStreamSteps([]);
    setStreamAttempt(1);
    reset();

    const hours = Number(weeklyHours);
    if (!Number.isInteger(hours) || hours < 1 || hours > 80) {
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

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const roadmap = await mutateAsync({
        payload,
        signal: controller.signal,
        onEvent: (event: RoadmapGenerationEvent) => {
          switch (event.event) {
            case "meta":
              hasStartedStreamRef.current = true;
              setGenerationStarted(true);
              setStreamTitle(event.data.title);
              break;
            case "step":
              hasStartedStreamRef.current = true;
              setGenerationStarted(true);
              setStreamSteps((steps) => [
                ...steps,
                { ...event.data, resources: [] },
              ]);
              break;
            case "resources":
              setStreamSteps((steps) => steps.map((step) => (
                step.order === event.data.order
                  ? { ...step, resources: event.data.resources }
                  : step
              )));
              break;
            case "reset":
              setGenerationStarted(hasStartedStreamRef.current);
              setStreamTitle(undefined);
              setStreamSteps([]);
              setStreamAttempt(event.data.attempt);
              break;
            case "error":
              setStreamError(event.data.detail);
              break;
            case "done":
              break;
          }
        },
      });
      navigate(`/roadmaps/${roadmap.id}`, {
        state: { from: { pathname: "/roadmaps/generate" } },
      });
    } catch (caughtError) {
      if (!controller.signal.aborted && hasStartedStreamRef.current) {
        setStreamError(getErrorMessage(caughtError));
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  const apiError = getErrorMessage(error);

  const returnToForm = () => {
    setGenerationStarted(false);
    hasStartedStreamRef.current = false;
    setStreamError(undefined);
    setStreamTitle(undefined);
    setStreamSteps([]);
    reset();
  };

  return (
    <AppLayout>
      <div className={styles.surface}>
        <div className={styles.page}>
          <Link className={styles.backLink} to="/roadmaps">
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
                  {streamError ? "La génération a rencontré un problème" : streamTitle ?? "Votre roadmap se construit"}
                </h2>
                <p>
                  {streamError
                    ? "La génération n'a pas abouti. Vos paramètres sont conservés."
                    : `Les étapes apparaissent au fil de la génération${streamAttempt > 1 ? ` · nouvelle tentative ${streamAttempt}` : ""}.`}
                </p>
              </div>
            </div>

            {streamError ? (
              <div className={styles.error} role="alert">
                <Icon name="error" />
                <span>{streamError}</span>
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
                      {step.resources.length > 0 ? (
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
          </section>
        ) : (
        <div className={styles.columns}>
          <form className={styles.form} onSubmit={(event) => void submit(event)}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="roadmap-goal">Quel est votre objectif ou sujet ?</label>
              <input
                id="roadmap-goal"
                className={styles.input}
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="Ex. : Lancer un produit SaaS en 3 mois"
                minLength={10}
                maxLength={500}
                required
                disabled={isPending}
              />
              <p className={styles.helper}>Décrivez un objectif concret en 10 à 500 caractères.</p>
            </div>

            <fieldset className={styles.fieldset}>
              <legend className={styles.label}>Catégorie de la roadmap</legend>
              <div className={styles.choices}>
                {ROADMAP_CATEGORY_OPTIONS.map((item) => (
                  <label className={`${styles.choice} ${category === item.value ? styles.selected : ""}`} key={item.value}>
                    <input
                      type="radio"
                      name="roadmap-category"
                      value={item.value}
                      checked={category === item.value}
                      onChange={() => setCategory(item.value)}
                      disabled={isPending}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={styles.scheduleFields}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="weekly-hours">Temps disponible par semaine</label>
                <div className={styles.hoursControl}>
                  <input
                    id="weekly-hours"
                    className={styles.input}
                    type="number"
                    min={1}
                    max={80}
                    step={1}
                    value={weeklyHours}
                    onChange={(event) => setWeeklyHours(event.target.value)}
                    disabled={isPending}
                    required
                  />
                  <span>heures</span>
                </div>
                <p className={styles.helper}>Un rythme réaliste vaut mieux qu'un rythme idéal.</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="deadline">Durée prévue pour atteindre l'objectif</label>
                <select
                  id="deadline"
                  className={styles.input}
                  value={deadlineWeeks}
                  onChange={(event) => setDeadlineWeeks(event.target.value)}
                  disabled={isPending}
                >
                  {deadlines.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <p className={styles.helper}>L'IA ajuste le nombre et la taille des étapes.</p>
              </div>
            </div>

            <fieldset className={styles.fieldset}>
              <legend className={styles.label}>Votre niveau actuel sur ce sujet</legend>
              <div className={styles.choices}>
                {levels.map((item) => (
                  <label className={`${styles.choice} ${level === item.value ? styles.selected : ""}`} key={item.value}>
                    <input
                      type="radio"
                      name="learner-level"
                      value={item.value}
                      checked={level === item.value}
                      onChange={() => setLevel(item.value)}
                      disabled={isPending}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <p className={styles.helper}>Vous pourrez ajuster votre parcours au fil de votre progression.</p>
            </fieldset>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="background">Contexte additionnel (optionnel)</label>
              <textarea
                id="background"
                className={`${styles.input} ${styles.textarea}`}
                rows={4}
                maxLength={500}
                value={background}
                onChange={(event) => setBackground(event.target.value)}
                placeholder="Précisez votre expérience ou vos contraintes particulières…"
                disabled={isPending}
              />
              <p className={styles.helper}>500 caractères maximum.</p>
            </div>

            {validationError || error ? (
              <div className={styles.error} role="alert">
                <Icon name="error" />
                <span>{validationError ?? apiError}</span>
              </div>
            ) : null}

            <div className={styles.formActions}>
              <Button type="submit" isLoading={isPending} disabled={isPending} icon="arrow_forward">
                {isPending ? "Génération en cours…" : "Générer la roadmap"}
              </Button>
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
                  setCategory("programming");
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
    </AppLayout>
  );
}
