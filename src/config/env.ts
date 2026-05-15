import { z } from "zod";
import { config } from "dotenv";

config({ path: `.env.development.local` });

export const envSchema = z.object({
  PORT: z.coerce.number().int().default(3000),
  DB_URL: z.string(),
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
