import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../../shared/components/Input";
import { Button } from "../../../../shared/components/Button";
import { loginSchema, type LoginFormValues } from "../../schemas/loginSchema";
import { useLoginMutation } from "../../hooks/useLoginMutation";
import styles from "./LoginForm.module.scss";


interface LoginFormProps {
  /** Appelé une fois la connexion réussie */
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const { mutate, isPending, error } = useLoginMutation();

  const onSubmit = (values: LoginFormValues) => {
    mutate(
      { email: values.email, password: values.password },
      { onSuccess },
    );
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
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
        {...register("password")}
      />

      <div className={styles.forgotRow}>
        <a href="#" onClick={(e) => e.preventDefault()}>
          Mot de passe oublié ?
        </a>
      </div>

      {error && (
        <p className={styles.formError} role="alert">
          {error.message}
        </p>
      )}

      <Button type="submit" icon="arrow_forward" isLoading={isPending}>
        Se connecter
      </Button>
    </form>
  );
}
