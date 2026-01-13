import { pgTable, text, serial, boolean, integer, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Recipes
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  url: text("url"),
  ingredients: text("ingredients").array().notNull(),
  instructions: text("instructions").notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
});

// Meals
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  day: text("day").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  notes: text("notes"),
  recipeId: integer("recipe_id"),
});

// Grocery Items
export const groceryItems = pgTable("grocery_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  isBought: boolean("is_bought").default(false).notNull(),
  isCustom: boolean("is_custom").default(true).notNull(),
  sourceMeal: text("source_meal"),
});

// User Settings
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  workDays: text("work_days").array().default([]).notNull(),
  workShift: text("work_shift").default("day").notNull(),
  breakfastDays: text("breakfast_days").array().default([]).notNull(),
});

// Schemas
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, usageCount: true });
export const insertMealSchema = createInsertSchema(meals).omit({ id: true });
export const insertGroceryItemSchema = createInsertSchema(groceryItems).omit({ id: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true });

// Types
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type GroceryItem = typeof groceryItems.$inferSelect;
export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// Enums for frontend usage
export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"] as const;

// Re-export auth models
export * from "./models/auth";

// Re-export chat models
export * from "./models/chat";
