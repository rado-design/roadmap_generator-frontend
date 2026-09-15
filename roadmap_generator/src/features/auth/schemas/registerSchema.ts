import { z } from "zod";

/**
 * Règles alignées sur app/schemas/user.py::UserRegister (backend) :
 * - email : format valide (EmailStr)
 * - password : 8 caractères minimum
 * Le champ "Nom complet" du formulaire est envoyé tel quel dans `name`.
 */
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  email: z
    .string()
    .trim()
    .min(1, "L'e-mail est requis")
    .email("Adresse e-mail invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  acceptTerms: z
    .boolean()
    .refine((value) => value === true, {
      message: "Vous devez accepter les conditions d'utilisation",
    }),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
