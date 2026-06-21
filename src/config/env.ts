import { z } from "zod";
import { config } from "dotenv";

config({ path: `.env.development.local` });

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().default(3000),
  DB_URL: z.string(),
  JWT_REFRESH_SECRET: z.string().min(20),
  JWT_ACCESS_SECRET: z.string().min(20),
  JWT_REFRESH_EXPIRE: z.string().default("7d"),
  JWT_ACCESS_EXPIRE: z.string().default("25m"),
});

const parse = envSchema.safeParse(process.env);
if (!parse.success) {
  console.error(
    "Invalid environment variables",
    parse.error.flatten().fieldErrors,
  );

  process.exit(1);
}

export const env = parse.data;
