import * as schema from "@shared/schema";

const isProduction = process.env.NODE_ENV === "production";

let db: any;

if (isProduction) {
  // Use PostgreSQL in production - dynamic import
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const pg = await import("pg");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  const pool = new pg.Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  db = drizzle(pool, { schema });
} else {
  // Use SQLite in development - dynamic import
  const { drizzle: drizzleSqlite } = await import("drizzle-orm/better-sqlite3");
  const Database = (await import("better-sqlite3")).default;
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbPath = path.join(__dirname, "..", "eatio.db");
  const sqlite = new Database(dbPath);
  
  db = drizzleSqlite(sqlite, { schema });
}

export { db };
