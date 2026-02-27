import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
  captchaToken: z.string().min(1, "reCAPTCHA token is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const googleLoginSchema = z.object({
  token: z.string().min(1, "Google token is required"),
  rememberMe: z.boolean().optional(),
});

export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
