import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Bitte eine gültige E-Mail-Adresse eingeben'),
  password: z.string().min(8, 'Mindestens 8 Zeichen'),
});

export const signUpSchema = signInSchema.extend({
  displayName: z.string().min(2, 'Mindestens 2 Zeichen'),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email('Bitte eine gültige E-Mail-Adresse eingeben'),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Mindestens 8 Zeichen'),
    confirmPassword: z.string().min(8, 'Mindestens 8 Zeichen'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
