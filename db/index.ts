import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
  );
}

// Reuse one pool across hot reloads in development, otherwise every code
// change would open new connections until Postgres runs out.
const globalForDb = globalThis as unknown as { pgPool?: Pool };
const pool = globalForDb.pgPool ?? new Pool({ connectionString });
if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export const db = drizzle({ client: pool });
export { pool };
