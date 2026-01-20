import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Recipes
export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  url: text("url"),
  ingredients: text("ingredients").notNull(), // JSON string array
  instructions: text("instructions").notNull(),
  isFavorite: integer("is_favorite", { mode: 'boolean' }).default(false).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
});

// Meals
export const meals = sqliteTable("meals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  day: text("day").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  notes: text("notes"),
  recipeId: integer("recipe_id"),
  weekStart: text("week_start"),
});

// Grocery Items
export const groceryItems = sqliteTable("grocery_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name"),
  quantity: integer("quantity").default(1),
  unit: text("unit"),
  category: text("category").default("other"),
  isBought: integer("is_bought", { mode: 'boolean' }).default(false).notNull(),
  isCustom: integer("is_custom", { mode: 'boolean' }).default(true).notNull(),
  sourceMeal: text("source_meal"),
});

// User Settings
export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  workDays: text("work_days").notNull(), // JSON string array
  workShift: text("work_shift").default("day").notNull(),
  breakfastDays: text("breakfast_days").notNull(), // JSON string array
});

// Meal Plan Shares - for sharing weekly plans with family members
export const mealPlanShares = sqliteTable("meal_plan_shares", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull(),
  ownerName: text("owner_name"),
  invitedEmail: text("invited_email").notNull(),
  invitedUserId: text("invited_user_id"),
  permission: text("permission").default("view").notNull(),
  status: text("status").default("pending").notNull(),
  shareToken: text("share_token").notNull().unique(),
  createdAt: text("created_at").notNull(),
});

// Week History - stores archived weekly meal plans
export const weekHistory = sqliteTable("week_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  weekStart: text("week_start").notNull(),
  meals: text("meals").notNull(), // JSON string
  createdAt: text("created_at").notNull(),
});

// Schemas - manually define to accept arrays (they'll be converted to JSON strings in storage)
export const insertRecipeSchema = createInsertSchema(recipes)
  .omit({ id: true, userId: true, usageCount: true })
  .extend({
    ingredients: z.array(z.string()),
  });
export const updateRecipeSchema = createInsertSchema(recipes)
  .omit({ id: true, userId: true })
  .extend({
    ingredients: z.array(z.string()).optional(),
  });
export const insertMealSchema = createInsertSchema(meals).omit({ id: true, userId: true });
export const insertGroceryItemSchema = createInsertSchema(groceryItems)
  .omit({ id: true, userId: true })
  .extend({
    normalizedName: z.string().nullable().optional(),
    quantity: z.number().optional(),
    unit: z.string().nullable().optional(),
    category: z.string().optional(),
    isBought: z.boolean().optional(),
    isCustom: z.boolean().optional(),
    sourceMeal: z.string().nullable().optional(),
  });
export const insertUserSettingsSchema = createInsertSchema(userSettings)
  .omit({ id: true })
  .extend({
    workDays: z.array(z.string()).optional(),
    breakfastDays: z.array(z.string()).optional(),
  });
export const insertMealPlanShareSchema = createInsertSchema(mealPlanShares).omit({ id: true });
export const insertWeekHistorySchema = createInsertSchema(weekHistory).omit({ id: true });

// Types
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type InsertRecipeWithUser = InsertRecipe & { userId: string };

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type InsertMealWithUser = InsertMeal & { userId: string };

export type GroceryItem = typeof groceryItems.$inferSelect;
export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;
export type InsertGroceryItemWithUser = InsertGroceryItem & { userId: string };

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type MealPlanShare = typeof mealPlanShares.$inferSelect;
export type InsertMealPlanShare = z.infer<typeof insertMealPlanShareSchema>;

export type WeekHistory = typeof weekHistory.$inferSelect;
export type InsertWeekHistory = z.infer<typeof insertWeekHistorySchema>;

// Enums for frontend usage
export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"] as const;

// Re-export auth models
export * from "./models/auth";

// Re-export chat models
export * from "./models/chat";
