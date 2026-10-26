import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { AppLayout, PageHeader } from "../../app/layouts";
import {
  changePassword,
  getCurrentUser,
  getLearnerProfile,
  updateCurrentUser,
  updateLearnerProfile,
  type ExplanationTone,
  type LearnerLanguage,
  type LearnerProfile,
  type LearningStyle,
} from "../../features/users";
import { Button, Icon, LogoutConfirmDialog } from "../../shared/components";
import { useAuthStore } from "../../shared/lib/authStore";
import { apiClient } from "../../shared/lib/axios";
import styles from "./SettingsPage.module.scss";

const learnerLanguages: { value: LearnerLanguage; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

const learningStyles: { value: LearningStyle; label: string }[] = [
  { value: "visual", label: "Visuel" },
  { value: "reading", label: "Lecture" },
  { value: "hands_on", label: "Pratique" },
  { value: "audio_video", label: "Audio et vidéo" },
  { value: "mixed", label: "Varié" },
];

const tones: { value: ExplanationTone; label: string }[] = [
  { value: "encouraging", label: "Encourageant" },
  { value: "neutral", label: "Neutre" },
  { value: "direct", label: "Direct" },
];

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: unknown } } }).response;
    const detail = response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && typeof detail[0]?.msg === "string") return detail[0].msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function getInitials(firstName: string, lastName: string) {
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.trim();
  return initials.toLocaleUpperCase("fr") || "R";
}

export function SettingsPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);
  const userQuery = useQuery({ queryKey: ["users", "me"], queryFn: getCurrentUser });
  const learnerQuery = useQuery({ queryKey: ["users", "me", "learner-profile"], queryFn: getLearnerProfile });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [language, setLanguage] = useState<LearnerLanguage>("fr");
  const [learningStyle, setLearningStyle] = useState<LearningStyle>("mixed");
  const [tone, setTone] = useState<ExplanationTone>("neutral");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    if (userQuery.data) {
      setFirstName(userQuery.data.first_name ?? "");
      setLastName(userQuery.data.name ?? "");
    }
  }, [userQuery.data]);

  useEffect(() => {
    if (learnerQuery.data) {
      setLanguage(learnerQuery.data.language);
      setLearningStyle(learnerQuery.data.learning_style);
      setTone(learnerQuery.data.tone);
    }
  }, [learnerQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const learner = learnerQuery.data;
      if (!learner) throw new Error("Le profil d'apprenant n'est pas chargé.");
      const hasPassword = Boolean(currentPassword || newPassword || confirmPassword);
      if (hasPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          throw new Error("Renseignez les trois champs du mot de passe.");
        }
        if (newPassword.length < 8) {
          throw new Error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
        }
        if (newPassword !== confirmPassword) {
          throw new Error("La confirmation du nouveau mot de passe ne correspond pas.");
        }
      }

      const profilePayload: LearnerProfile = {
        ...learner,
        language,
        learning_style: learningStyle,
        tone,
      };
      const [user, profile] = await Promise.all([
        updateCurrentUser({ first_name: firstName.trim() || null, name: lastName.trim() || null }),
        updateLearnerProfile(profilePayload),
      ]);
      if (hasPassword) await changePassword({ current_password: currentPassword, new_password: newPassword });
      return { user, profile };
    },
    onSuccess: ({ user, profile }) => {
      client.setQueryData(["users", "me"], user);
      client.setQueryData(["users", "me", "learner-profile"], profile);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFormError("");
      setFormSuccess("Vos modifications ont été enregistrées.");
    },
    onError: (error) => {
      setFormSuccess("");
      setFormError(getErrorMessage(error, "Impossible d'enregistrer vos modifications. Réessayez."));
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    saveMutation.mutate();
  };

  const resetForm = () => {
    setFirstName(userQuery.data?.first_name ?? "");
    setLastName(userQuery.data?.name ?? "");
    setLanguage(learnerQuery.data?.language ?? "fr");
    setLearningStyle(learnerQuery.data?.learning_style ?? "mixed");
    setTone(learnerQuery.data?.tone ?? "neutral");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFormError("");
    setFormSuccess("");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError("");
    try {
      await apiClient.post("api/v1/auth/logout");
      client.clear();
      clearAccessToken();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("Déconnexion impossible. Vérifiez votre connexion puis réessayez.");
      setLogoutConfirmOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isLoading = userQuery.isLoading || learnerQuery.isLoading;
  const isError = userQuery.isError || learnerQuery.isError;
  const initials = getInitials(firstName, lastName);

  return (
    <AppLayout>
      <PageHeader
        title="Paramètres"
        description="Gérez vos informations personnelles, votre sécurité et vos préférences d'apprentissage."
      />

      {isLoading ? (
        <div className={styles.loadingPanel} aria-busy="true">Chargement de vos paramètres…</div>
      ) : isError ? (
        <section className={styles.statePanel} role="alert">
          <Icon name="cloud_off" />
          <p>Impossible de charger vos paramètres. Vérifiez votre connexion puis réessayez.</p>
          <Button variant="outline" onClick={() => { void userQuery.refetch(); void learnerQuery.refetch(); }}>Réessayer</Button>
        </section>
      ) : userQuery.data && learnerQuery.data ? (
        <form className={styles.settingsForm} onSubmit={handleSubmit}>
          <section className={styles.card} aria-labelledby="personal-info-title">
            <h2 className={styles.sectionTitle} id="personal-info-title">Informations personnelles</h2>
            <div className={styles.avatarRow}>
              <span className={styles.avatar} aria-hidden="true">{initials}</span>
              <div>
                <Button type="button" variant="outline" disabled title="Le changement de photo n'est pas disponible pour le moment.">Changer la photo</Button>
                <p className={styles.helper}>Le chargement d'une photo de profil sera disponible prochainement.</p>
              </div>
            </div>
            <div className={styles.personalFields}>
              <div className={styles.field}>
                <label htmlFor="settings-first-name">Prénom</label>
                <input id="settings-first-name" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={120} />
              </div>
              <div className={styles.field}>
                <label htmlFor="settings-last-name">Nom</label>
                <input id="settings-last-name" autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={120} />
              </div>
              <div className={styles.field}>
                <label htmlFor="settings-email">Adresse e-mail</label>
                <input id="settings-email" type="email" autoComplete="email" value={userQuery.data.email} readOnly aria-describedby="settings-email-helper" />
                <p className={styles.helper} id="settings-email-helper">L'adresse e-mail ne peut pas encore être modifiée.</p>
              </div>
            </div>
          </section>

          <div className={styles.lowerGrid}>
            <section className={`${styles.card} ${styles.learnerCard}`} aria-labelledby="learner-profile-title">
              <div>
                <h2 className={styles.sectionTitle} id="learner-profile-title">Profil d'apprenant</h2>
                <p className={styles.sectionDescription}>L'IA s'en sert pour personnaliser toutes vos roadmaps.</p>
              </div>
              <div className={styles.field}>
                <label htmlFor="settings-language">Langue des ressources</label>
                <select id="settings-language" value={language} onChange={(event) => setLanguage(event.target.value as LearnerLanguage)}>
                  {learnerLanguages.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <fieldset className={styles.choiceFieldset}>
                <legend>Style d'apprentissage</legend>
                <div className={styles.choices}>
                  {learningStyles.map((option) => (
                    <label className={`${styles.choice} ${learningStyle === option.value ? styles.selectedChoice : ""}`} key={option.value}>
                      <input type="radio" name="learning-style" value={option.value} checked={learningStyle === option.value} onChange={() => setLearningStyle(option.value)} />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className={styles.choiceFieldset}>
                <legend>Ton des explications</legend>
                <div className={styles.choices}>
                  {tones.map((option) => (
                    <label className={`${styles.choice} ${tone === option.value ? styles.selectedChoice : ""}`} key={option.value}>
                      <input type="radio" name="explanation-tone" value={option.value} checked={tone === option.value} onChange={() => setTone(option.value)} />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <div className={styles.rightColumn}>
              <section className={`${styles.card} ${styles.securityCard}`} aria-labelledby="security-title">
                <h2 className={styles.sectionTitle} id="security-title">Sécurité</h2>
                <div className={styles.field}>
                  <label htmlFor="settings-current-password">Mot de passe actuel</label>
                  <input id="settings-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="settings-new-password">Nouveau mot de passe</label>
                  <input id="settings-new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                  <p className={styles.helper}>8 caractères minimum.</p>
                </div>
                <div className={styles.field}>
                  <label htmlFor="settings-confirm-password">Confirmer le nouveau mot de passe</label>
                  <input id="settings-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                </div>
              </section>

              <section className={`${styles.card} ${styles.accountCard}`} aria-labelledby="account-title">
                <h2 className={styles.sectionTitle} id="account-title">Compte</h2>
                <div className={styles.accountActions}>
                  <Button type="button" variant="outline" onClick={() => setLogoutConfirmOpen(true)} isLoading={isLoggingOut}>Se déconnecter</Button>
                  <Button className={styles.deleteButton} type="button" variant="outline" disabled title="La suppression du compte n'est pas disponible pour le moment.">Supprimer mon compte</Button>
                </div>
                {logoutError ? <p className={styles.errorMessage} role="alert">{logoutError}</p> : null}
                <p className={styles.helper}>La suppression efface définitivement vos roadmaps et votre progression.</p>
              </section>
            </div>
          </div>

          {formError ? <p className={styles.errorMessage} role="alert">{formError}</p> : null}
          {formSuccess ? <p className={styles.successMessage} role="status">{formSuccess}</p> : null}
          <div className={styles.formActions}>
            <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
            <Button type="submit" isLoading={saveMutation.isPending}>Enregistrer les modifications</Button>
          </div>
        </form>
      ) : null}
      <LogoutConfirmDialog
        open={logoutConfirmOpen}
        isLoading={isLoggingOut}
        onConfirm={() => void handleLogout()}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </AppLayout>
  );
}
