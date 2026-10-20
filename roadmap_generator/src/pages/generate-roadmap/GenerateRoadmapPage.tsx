import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { AppLayout } from "../../app/layouts";
import { useGenerateRoadmap, type GenerateRoadmapRequest, type LearnerLevel, type RoadmapCategory } from "../../features/roadmaps";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import styles from "./GenerateRoadmapPage.module.scss";

const categories: { value: RoadmapCategory; label: string }[] = [
  { value: "programming", label: "Développement" },
  { value: "marketing_sales", label: "Marketing" },
  { value: "project_management", label: "Produit" },
  { value: "ux_ui_design", label: "Design" },
  { value: "other", label: "Autre domaine" },
];

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

export function GenerateRoadmapPage() {
  const navigate = useNavigate();
  const { mutateAsync, isPending, error } = useGenerateRoadmap();
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState<RoadmapCategory>("programming");
  const [weeklyHours, setWeeklyHours] = useState("5");
  const [deadlineWeeks, setDeadlineWeeks] = useState("12");
  const [level, setLevel] = useState<LearnerLevel>("beginner");
  const [background, setBackground] = useState("");
  const [validationError, setValidationError] = useState<string>();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(undefined);

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

    try {
      const roadmap = await mutateAsync(payload);
      navigate(`/roadmaps/${roadmap.id}`, {
        state: { from: { pathname: "/roadmaps/generate" } },
      });
    } catch {
      // L'erreur de mutation est affichée sous le formulaire.
    }
  };

  const apiError = typeof error === "object" && error !== null && "message" in error
    ? String(error.message)
    : "La génération a échoué. Vérifiez votre connexion puis réessayez.";

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
                {categories.map((item) => (
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
              {isPending ? <p role="status">La génération peut prendre quelques instants. Cette page reste ouverte pendant le traitement.</p> : null}
            </div>
          </form>

          <aside className={styles.aside}>
            <section className={styles.howItWorks} aria-labelledby="how-it-works-title">
              <h2 id="how-it-works-title">Comment ça marche ?</h2>
              <ol>
                <li>
                  <span>1</span>
                  <div><strong>Définissez l'objectif</strong><p>Soyez aussi précis que possible pour obtenir un parcours pertinent.</p></div>
                </li>
                <li>
                  <span>2</span>
                  <div><strong>Choisissez les domaines</strong><p>Sélectionnez la catégorie et le rythme adaptés à votre projet.</p></div>
                </li>
                <li>
                  <span>3</span>
                  <div><strong>Laissez l'IA structurer le parcours</strong><p>Votre roadmap apparaît dès que sa génération est terminée.</p></div>
                </li>
              </ol>
            </section>

            <section className={styles.inspiration} aria-labelledby="inspiration-title">
              <h2 id="inspiration-title">Inspiration</h2>
              <p>« Apprendre le développement mobile avec Flutter en 6 mois »</p>
              <button
                type="button"
                onClick={() => {
                  setGoal("Apprendre le développement mobile avec Flutter en 6 mois");
                  setCategory("mobile_dev");
                }}
                disabled={isPending}
              >
                Essayer cet exemple <Icon name="arrow_forward" />
              </button>
            </section>
          </aside>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
