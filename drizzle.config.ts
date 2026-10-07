import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so load the same env file Next.js uses.
// On Vercel the file is absent and the variables come from the environment.
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
