import * as schema from "@shared/schema";

const isProduction = process.env.NODE_ENV === "production";

let db: any;

async function initializeDb() {
  try {
    console.log("=== DB INIT START ===");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("Is Production:", isProduction);
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    
    if (isProduction) {
      // Use PostgreSQL in production - dynamic import
      console.log("Loading PostgreSQL driver...");
      const { drizzle } = await import("drizzle-orm/node-postgres");
      console.log("Drizzle imported");
      
      const pg = await import("pg");
      console.log("pg imported");
      
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is not set");
      }
      
      console.log("Creating pool...");
      const pool = new pg.Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        // Connection pool optimization for faster responses
        max: 20,                    // Maximum connections in pool
        min: 2,                     // Minimum connections to keep open
        idleTimeoutMillis: 30000,   // Close idle connections after 30s
        connectionTimeoutMillis: 5000, // Timeout after 5s if no connection available
        allowExitOnIdle: false      // Don't let Node exit with idle connections
      });
      
      console.log("Creating drizzle instance...");
      db = drizzle(pool, { schema });
      console.log("=== DB INIT SUCCESS ===");
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
      console.log("=== DB INIT SUCCESS (SQLite) ===");
    }
    
    return db;
  } catch (error) {
    console.error("=== DB INIT FAILED ===");
    console.error("Error:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack");
    throw error;
  }
}

// Initialize immediately
const dbPromise = initializeDb();

export { db, dbPromise };
