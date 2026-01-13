import { pgTable, text, serial, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Recipes
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url"),
  ingredients: text("ingredients").array().notNull(),
  instructions: text("instructions").notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  usageCount: integer("usage_count").default(0).notNull(), // For "Top 10"
});

// Meals
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(), // Monday, Tuesday, etc.
  type: text("type").notNull(), // lunch, dinner
  name: text("name").notNull(),
  notes: text("notes"),
  recipeId: integer("recipe_id"), // Optional link to recipe
});

// Grocery Items
export const groceryItems = pgTable("grocery_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isBought: boolean("is_bought").default(false).notNull(),
  isCustom: boolean("is_custom").default(true).notNull(), // true if added manually
});

// Schemas
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, usageCount: true });
export const insertMealSchema = createInsertSchema(meals).omit({ id: true });
export const insertGroceryItemSchema = createInsertSchema(groceryItems).omit({ id: true });

// Types
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type GroceryItem = typeof groceryItems.$inferSelect;
export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;

// Enums for frontend usage
export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"] as const;

// Re-export chat models
export * from "./models/chat";
