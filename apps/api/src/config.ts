import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .default("postgresql://ksirovka:ksirovka_dev@localhost:3840/ksirovka"),
  REDIS_URL: z.string().default("redis://localhost:3841"),
  API_PORT: z.coerce.number().default(3801),
  API_HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3800,https://ksirovka.martinpolak.cz,https://ksirovka.cz"),
  CONTACT_RATE_LIMIT_MAX: z.coerce.number().default(5),
  CONTACT_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  SCORECARD_RATE_LIMIT_MAX: z.coerce.number().default(40),
  SCORECARD_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  LEGACY_SITE_URL: z.string().default("https://ksirovka.cz"),
  ADMIN_PASSWORD: z.string().default("ksirovka"),
  ADMIN_SESSION_SECRET: z.string().default("dev-admin-session-secret"),
  APP_COMMIT: z.string().default("dev"),
  WEB_DIST: z.string().optional(),
});

export const config = envSchema.parse(process.env);
