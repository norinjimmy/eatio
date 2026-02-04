import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

async function runMigrations() {
  console.log("=== RUNNING MIGRATIONS ===");
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const db = drizzle(pool, { schema });

  try {
    // Drop existing tables if FORCE_RESET is set (for fixing schema issues)
    if (process.env.FORCE_RESET === "true") {
      console.log("⚠️  FORCE_RESET=true, dropping all tables...");
      await db.execute(sql`DROP TABLE IF EXISTS messages CASCADE;`);
      await db.execute(sql`DROP TABLE IF EXISTS conversations CASCADE;`);
      await db.execute(sql`DROP TABLE IF EXISTS meal_plan_shares CASCADE;`);
      await db.execute(sql`DROP TABLE IF EXISTS week_history CASCADE;`);
      await db.execute(sql`DROP TABLE IF EXISTS grocery_items CASCADE;`);
      await db.execute(sql`DROP TABLE IF EXISTS meals CASCADE;`);
      await db.execute(sql`DROP TABLE IF EXISTS recipes CASCADE;`);
      await db.execute(sql`DROP TABLE IF EXISTS user_settings CASCADE;`);
      await db.execute(sql`DROP TABLE IF EXISTS sessions CASCADE;`);
      await db.execute(sql`DROP TABLE IF EXISTS users CASCADE;`);
      console.log("✓ All tables dropped");
    }

    console.log("Creating tables from schema...");
    
    // Users table - for authentication (not defined in schema.ts, but needed by auth system)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    console.log("✓ Created users table");

    // Sessions table - for authentication
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);
    console.log("✓ Created sessions table");

    // User Settings table - matches schema exactly
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        work_days TEXT NOT NULL,
        work_shift TEXT DEFAULT 'day' NOT NULL,
        breakfast_days TEXT NOT NULL
      );
    `);
    console.log("✓ Created user_settings table");

    // Recipes table - matches schema exactly
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
        usage_count INTEGER DEFAULT 0 NOT NULL
      );
    `);
    console.log("✓ Created recipes table");

    // Meals table - matches schema exactly
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS meals (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        day TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        notes TEXT,
        recipe_id INTEGER,
        week_start TEXT
      );
    `);
    console.log("✓ Created meals table");

    // Grocery Items table - matches schema exactly
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS grocery_items (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        normalized_name TEXT,
        quantity REAL DEFAULT 1,
        unit TEXT,
        category TEXT DEFAULT 'other',
        is_bought BOOLEAN DEFAULT FALSE NOT NULL,
        is_custom BOOLEAN DEFAULT TRUE NOT NULL,
        source_meal TEXT
      );
    `);
    console.log("✓ Created grocery_items table");

    // Week History table - matches schema exactly
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS week_history (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        week_start TEXT NOT NULL,
        meals TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    console.log("✓ Created week_history table");

    // Meal Plan Shares table - matches schema exactly
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS meal_plan_shares (
        id SERIAL PRIMARY KEY,
        owner_id TEXT NOT NULL,
        owner_name TEXT,
        invited_email TEXT NOT NULL,
        invited_user_id TEXT,
        permission TEXT DEFAULT 'view' NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        share_token TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      );
    `);
    console.log("✓ Created meal_plan_shares table");

    // Conversations table - from chat models
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    console.log("✓ Created conversations table");

    // Messages table - from chat models
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    console.log("✓ Created messages table");

    // Create indexes for better query performance
    console.log("Creating indexes for performance...");
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_meals_week ON meals(user_id, week_start);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_grocery_user_id ON grocery_items(user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON messages(conversation_id);`);
    console.log("✓ Created indexes");

    // Run ALTER TABLE migrations for existing columns
    console.log("Running column type migrations...");
    try {
      await db.execute(sql`ALTER TABLE grocery_items ALTER COLUMN quantity TYPE REAL;`);
      console.log("✓ Changed quantity column to REAL");
    } catch (error: any) {
      // Ignore error if column is already REAL or doesn't exist
      if (error.code === '42804' || error.message?.includes('already type')) {
        console.log("✓ Quantity column already REAL (or compatible)");
      } else {
        console.warn("⚠️  Could not alter quantity column:", error.message);
      }
    }

    console.log("=== ALL TABLES CREATED SUCCESSFULLY ===");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigrations()
  .then(() => {
    console.log("Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
