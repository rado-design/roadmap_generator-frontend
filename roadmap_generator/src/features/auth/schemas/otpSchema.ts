import { z } from "zod";

export const otpSchema = z.object({
  code: z
    .string()
    .length(6, "Le code doit contenir exactement 6 chiffres")
    .regex(/^\d{6}$/, "Le code ne doit contenir que des chiffres"),
});

export type OtpFormValues = z.infer<typeof otpSchema>;
