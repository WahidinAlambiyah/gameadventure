import { z } from "zod";

const envSchema = z.object({
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5432/bacangaji"),
  DIRECT_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/bacangaji"),
  BETTER_AUTH_SECRET: z.string().min(32).default("development-secret-change-before-production"),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("BacaNgaji Adventure <noreply@example.com>"),
  EMAIL_PROVIDER_API_KEY: z.string().optional().default(""),
  SUPABASE_URL: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional().default(""),
  TURNSTILE_SECRET_KEY: z.string().optional().default(""),
  LOG_LEVEL: z.enum(["silent", "debug", "info", "warn", "error"]).default("info"),
  SENTRY_DSN: z.string().optional().default("")
});

const productionRequired = [
  "DATABASE_URL",
  "DIRECT_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_APP_URL"
] as const;

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(input: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }

  if (parsed.data.APP_ENV === "production") {
    for (const key of productionRequired) {
      const value = input[key];
      if (!value || value.includes("localhost") || value.includes("replace-with")) {
        throw new Error(`Production environment variable ${key} must be configured securely.`);
      }
    }
  }

  return parsed.data;
}

export const env = loadEnv();
