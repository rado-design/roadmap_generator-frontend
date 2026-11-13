import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { AppLayout, PageHeader } from "../../app/layouts";
import {
  changePassword,
  cancelEmailChange,
  confirmEmailChange,
  deleteAvatar,
  getCurrentUser,
  getLearnerProfile,
  requestEmailChange,
  uploadAvatar,
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
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") return error.message;
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
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
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
  const [avatarFeedback, setAvatarFeedback] = useState("");
  const [avatarFeedbackType, setAvatarFeedbackType] = useState<"success" | "error">("success");
  const [emailChangeEmail, setEmailChangeEmail] = useState("");
  const [emailChangePassword, setEmailChangePassword] = useState("");
  const [emailChangeCode, setEmailChangeCode] = useState("");
  const [emailFeedback, setEmailFeedback] = useState("");
  const [emailFeedbackType, setEmailFeedbackType] = useState<"success" | "error">("success");
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [resendWaitSeconds, setResendWaitSeconds] = useState(0);

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

  useEffect(() => {
    setEmailChangeEmail(userQuery.data?.pending_email ?? "");
  }, [userQuery.data?.pending_email]);

  useEffect(() => {
    if (resendAvailableAt === null) return;
    const updateCountdown = () => setResendWaitSeconds(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)));
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (user) => {
      client.setQueryData(["users", "me"], user);
      setAvatarFeedbackType("success");
      setAvatarFeedback("Photo de profil mise à jour.");
    },
    onError: (error) => { setAvatarFeedbackType("error"); setAvatarFeedback(getErrorMessage(error, "Impossible de charger cette photo.")); },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: deleteAvatar,
    onSuccess: () => {
      client.setQueryData<Awaited<ReturnType<typeof getCurrentUser>>>(["users", "me"], (user) => user ? { ...user, avatar_url: null } : user);
      setAvatarFeedbackType("success");
      setAvatarFeedback("Photo de profil supprimée.");
    },
    onError: (error) => { setAvatarFeedbackType("error"); setAvatarFeedback(getErrorMessage(error, "Impossible de supprimer la photo.")); },
  });

  const emailRequestMutation = useMutation({
    mutationFn: requestEmailChange,
    onSuccess: (user) => {
      client.setQueryData(["users", "me"], user);
      setEmailChangeCode("");
      setEmailFeedbackType("success");
      setEmailFeedback(`Un code de vérification a été envoyé à ${user.pending_email ?? emailChangeEmail}.`);
      setResendAvailableAt(Date.now() + 60_000);
    },
    onError: (error) => { setEmailFeedbackType("error"); setEmailFeedback(getErrorMessage(error, "Impossible d'envoyer le code. Vérifiez votre mot de passe et réessayez.")); },
  });

  const emailConfirmMutation = useMutation({
    mutationFn: confirmEmailChange,
    onSuccess: (user) => {
      client.setQueryData(["users", "me"], user);
      setEmailChangePassword("");
      setEmailChangeCode("");
      setResendAvailableAt(null);
      setEmailFeedbackType("success");
      setEmailFeedback("Votre adresse e-mail a été modifiée.");
    },
    onError: (error) => { setEmailFeedbackType("error"); setEmailFeedback(getErrorMessage(error, "Le code n'a pas pu être confirmé. Vérifiez-le puis réessayez.")); },
  });

  const emailCancelMutation = useMutation({
    mutationFn: cancelEmailChange,
    onSuccess: () => {
      client.setQueryData<Awaited<ReturnType<typeof getCurrentUser>>>(["users", "me"], (user) => user ? { ...user, pending_email: null } : user);
      setEmailChangePassword("");
      setEmailChangeCode("");
      setResendAvailableAt(null);
      setEmailFeedbackType("success");
      setEmailFeedback("La demande de changement d'adresse a été annulée.");
    },
    onError: (error) => { setEmailFeedbackType("error"); setEmailFeedback(getErrorMessage(error, "Impossible d'annuler la demande. Réessayez.")); },
  });

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

  const handleAvatarFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setAvatarFeedbackType("error");
      setAvatarFeedback("Choisissez une image JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarFeedbackType("error");
      setAvatarFeedback("La photo ne doit pas dépasser 2 Mo.");
      return;
    }
    setAvatarFeedback("");
    setAvatarFeedbackType("success");
    avatarMutation.mutate(file);
  };

  const handleEmailChangeRequest = () => {
    setEmailFeedback("");
    if (!emailChangeEmail.trim()) {
      setEmailFeedbackType("error");
      setEmailFeedback("Saisissez la nouvelle adresse e-mail.");
      emailInputRef.current?.focus();
      return;
    }
    if (!emailInputRef.current?.checkValidity()) {
      setEmailFeedbackType("error");
      setEmailFeedback("Saisissez une adresse e-mail valide.");
      emailInputRef.current?.reportValidity();
      return;
    }
    if (!emailChangePassword) {
      setEmailFeedbackType("error");
      setEmailFeedback("Saisissez votre mot de passe actuel pour confirmer cette demande.");
      return;
    }
    emailRequestMutation.mutate({ new_email: emailChangeEmail.trim(), current_password: emailChangePassword });
  };

  const handleEmailChangeConfirm = () => {
    setEmailFeedback("");
    if (!/^\d{6}$/.test(emailChangeCode)) {
      setEmailFeedbackType("error");
      setEmailFeedback("Saisissez le code à 6 chiffres reçu à la nouvelle adresse.");
      return;
    }
    emailConfirmMutation.mutate({ otp_code: emailChangeCode });
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
    setEmailChangeEmail(userQuery.data?.pending_email ?? "");
    setEmailChangePassword("");
    setEmailChangeCode("");
    setEmailFeedback("");
    setResendAvailableAt(null);
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
  const hasPendingEmail = Boolean(userQuery.data?.pending_email);
  const emailBusy = emailRequestMutation.isPending || emailConfirmMutation.isPending || emailCancelMutation.isPending;
  const avatarBusy = avatarMutation.isPending || deleteAvatarMutation.isPending;

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
              {userQuery.data.avatar_url ? (
                <img className={styles.avatarImage} src={userQuery.data.avatar_url} alt="Photo de profil" />
              ) : (
                <span className={styles.avatar} aria-hidden="true">{initials}</span>
              )}
              <div>
                <input className={styles.visuallyHidden} ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarFile} aria-label="Choisir une photo de profil" />
                <div className={styles.avatarActions}>
                  <Button type="button" variant="outline" disabled={avatarBusy} isLoading={avatarMutation.isPending} onClick={() => avatarInputRef.current?.click()}>
                    {userQuery.data.avatar_url ? "Changer la photo" : "Ajouter une photo"}
                  </Button>
                  {userQuery.data.avatar_url ? <Button type="button" variant="outline" disabled={avatarBusy} isLoading={deleteAvatarMutation.isPending} onClick={() => deleteAvatarMutation.mutate()}>Supprimer la photo</Button> : null}
                </div>
                <p className={styles.helper}>JPEG, PNG ou WebP · 2 Mo maximum</p>
                {avatarFeedback ? <p className={avatarFeedbackType === "error" ? styles.errorMessage : styles.successMessage} role={avatarFeedbackType === "error" ? "alert" : "status"}>{avatarFeedback}</p> : null}
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
                <p className={styles.helper} id="settings-email-helper">Adresse utilisée pour vous connecter.</p>
              </div>
            </div>
            <div className={styles.emailChangePanel}>
              <h3>Changer l'adresse e-mail</h3>
              <p className={styles.helper}>Un code à usage unique sera envoyé à la nouvelle adresse pour confirmer le changement.</p>
              <div className={styles.emailChangeFields}>
              <div className={styles.field}>
                <label htmlFor="settings-new-email">Nouvelle adresse e-mail</label>
                <input
                  id="settings-new-email"
                  ref={emailInputRef}
                  type="email"
                  autoComplete="email"
                  value={emailChangeEmail}
                  onChange={(event) => setEmailChangeEmail(event.target.value)}
                  aria-describedby="settings-email-change-helper"
                />
                <p className={styles.helper} id="settings-email-change-helper">
                  {hasPendingEmail
                    ? `Un code a été envoyé à ${userQuery.data.pending_email}. Saisissez-le ci-dessous pour confirmer.`
                    : "Votre mot de passe actuel sera demandé et un code sera envoyé à cette adresse."}
                </p>
              </div>
              <div className={styles.field}>
                <label htmlFor="settings-email-current-password">Mot de passe actuel pour modifier l'adresse</label>
                <input
                  id="settings-email-current-password"
                  type="password"
                  autoComplete="current-password"
                  value={emailChangePassword}
                  onChange={(event) => setEmailChangePassword(event.target.value)}
                />
              </div>
              </div>
              <div className={styles.emailChangeActions}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={emailBusy || (hasPendingEmail && resendWaitSeconds > 0)}
                  isLoading={emailRequestMutation.isPending}
                  onClick={handleEmailChangeRequest}
                >
                  {hasPendingEmail
                    ? resendWaitSeconds > 0 ? `Renvoyer le code dans ${resendWaitSeconds}s` : "Renvoyer le code"
                    : "Envoyer le code de vérification"}
                </Button>
                {hasPendingEmail ? <Button type="button" variant="outline" disabled={emailBusy} onClick={() => emailCancelMutation.mutate()}>Annuler la demande</Button> : null}
              </div>
              {hasPendingEmail ? (
                <div className={styles.emailConfirmation}>
                  <div className={styles.field}>
                    <label htmlFor="settings-email-code">Code de vérification</label>
                    <input
                      id="settings-email-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={emailChangeCode}
                      onChange={(event) => setEmailChangeCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      aria-describedby="settings-email-code-helper"
                    />
                    <p className={styles.helper} id="settings-email-code-helper">Saisissez les 6 chiffres envoyés à {userQuery.data.pending_email}.</p>
                  </div>
                  <Button type="button" disabled={emailBusy} isLoading={emailConfirmMutation.isPending} onClick={handleEmailChangeConfirm}>Confirmer la nouvelle adresse</Button>
                </div>
              ) : null}
              {emailFeedback ? <p className={emailFeedbackType === "error" ? styles.errorMessage : styles.successMessage} role={emailFeedbackType === "error" ? "alert" : "status"}>{emailFeedback}</p> : null}
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
