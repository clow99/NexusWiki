import { z } from "zod";

const baseSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().min(1),
});

const authSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

const resendSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().min(1),
});

function validateEnv<T extends z.ZodTypeAny>(schema: T, label: string) {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      `Missing required environment variables for ${label}:`,
      parsed.error.flatten().fieldErrors,
    );
    throw new Error(`Missing required environment variables for ${label}.`);
  }
  return parsed.data as z.infer<T>;
}

let cachedBase: z.infer<typeof baseSchema> | null = null;
let cachedAuth: z.infer<typeof authSchema> | null = null;
let cachedResend: z.infer<typeof resendSchema> | null = null;

export function getBaseEnv() {
  if (!cachedBase) {
    cachedBase = validateEnv(baseSchema, "base");
  }
  return cachedBase;
}

export function getAuthEnv() {
  if (!cachedAuth) {
    cachedAuth = validateEnv(authSchema, "auth");
  }
  return cachedAuth;
}

export function getResendEnv() {
  if (!cachedResend) {
    cachedResend = validateEnv(resendSchema, "resend");
  }
  return cachedResend;
}
