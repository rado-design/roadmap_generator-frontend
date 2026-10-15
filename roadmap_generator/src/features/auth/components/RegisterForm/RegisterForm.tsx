import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../../shared/components/Input";
import { Checkbox } from "../../../../shared/components/Checkbox";
import { Button } from "../../../../shared/components/Button";
import { registerSchema, type RegisterFormValues } from "../../schemas/registerSchema";
import { useRegisterMutation } from "../../hooks/useRegisterMutation";
import styles from "./RegisterForm.module.scss";


interface RegisterFormProps {
  /** Appelé avec l'email inscrit une fois l'inscription réussie côté API */
  onSuccess: (email: string) => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      firstName: "",
      email: "",
      password: "",
      acceptTerms: false,
    },
  });

  const { mutate, isPending, error } = useRegisterMutation();

  const onSubmit = (values: RegisterFormValues) => {
    mutate(
      { email: values.email, password: values.password, name: values.name },
      { onSuccess: (data) => onSuccess(data.email) },
    );
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        label="Nom"
        icon="person"
        placeholder="Dupont"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Prénom"
        icon="person"
        placeholder="Jean"
        error={errors.firstName?.message}
        {...register("firstName")}
      />

      <Input
        label="Adresse e-mail"
        icon="mail"
        type="email"
        placeholder="jean@exemple.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Mot de passe"
        icon="lock"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        helperText={errors.password ? undefined : "Minimum 8 caractères."}
        {...register("password")}
      />

      <Checkbox
        error={errors.acceptTerms?.message}
        label={
          <>
            J'accepte les{" "}
            <button
              type="button"
              className={styles.inlineLegalBtn}
              onClick={() => setActiveModal("terms")}
            >
              conditions d'utilisation
            </button>{" "}
            et la{" "}
            <button
              type="button"
              className={styles.inlineLegalBtn}
              onClick={() => setActiveModal("privacy")}
            >
              politique de confidentialité
            </button>
            .
          </>
        }
        {...register("acceptTerms")}
      />

      {error && (
        <p className={styles.formError} role="alert">
          {error.message}
        </p>
      )}

      <Button type="submit" icon="arrow_forward" isLoading={isPending}>
        S'inscrire gratuitement
      </Button>

      {activeModal && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
        >
          <div className={styles.modalCard}>
            <h3 id="legal-modal-title" className={styles.modalTitle}>
              {activeModal === "terms"
                ? "Conditions d'utilisation"
                : "Politique de confidentialité"}
            </h3>
            <div className={styles.modalBody}>
              {activeModal === "terms" ? (
                <p>
                  RoadmapAI est un outil d'accompagnement et de planification
                  personnalisée par intelligence artificielle. Vos données de
                  parcours restent sous votre contrôle et ne sont jamais
                  revendues.
                </p>
              ) : (
                <p>
                  Nous collectons uniquement votre adresse e-mail pour sécuriser
                  l'accès à votre compte via code OTP et vous transmettre vos
                  parcours générés.
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveModal(null)}
            >
              Fermer
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
