import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const isProduction = process.env.NODE_ENV === "production";

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzleSqlite>;

if (isProduction) {
  // Use PostgreSQL in production
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
  // Use SQLite in development
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbPath = path.join(__dirname, "..", "eatio.db");
  const sqlite = new Database(dbPath);
  
  db = drizzleSqlite(sqlite, { schema });
}

export { db };
