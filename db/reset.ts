import { pool } from "./index";

/**
 * Development only: wipes every table and the migration history so the
 * migrations can be applied from scratch. Follow with db:migrate and db:seed.
 */
async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to reset the database in production.");
  }
  await pool.query(`
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
    DROP SCHEMA IF EXISTS drizzle CASCADE;
  `);
  console.log("Database reset. Run db:migrate, then db:seed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
