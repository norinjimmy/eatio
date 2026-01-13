import { db } from "./db";
import {
  recipes, meals, groceryItems, userSettings, mealPlanShares,
  type Recipe, type InsertRecipe,
  type Meal, type InsertMeal,
  type GroceryItem, type InsertGroceryItem,
  type UserSettings, type InsertUserSettings,
  type MealPlanShare, type InsertMealPlanShare
} from "@shared/schema";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  // Recipes
  getRecipes(userId: string): Promise<Recipe[]>;
  getRecipe(userId: string, id: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(userId: string, id: number, updates: Partial<InsertRecipe>): Promise<Recipe>;
  deleteRecipe(userId: string, id: number): Promise<void>;

  // Meals
  getMeals(userId: string): Promise<Meal[]>;
  getMeal(userId: string, id: number): Promise<Meal | undefined>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  updateMeal(userId: string, id: number, updates: Partial<InsertMeal>): Promise<Meal>;
  deleteMeal(userId: string, id: number): Promise<void>;
  deleteAllMeals(userId: string): Promise<void>;

  // Grocery
  getGroceryItems(userId: string): Promise<GroceryItem[]>;
  getGroceryItem(userId: string, id: number): Promise<GroceryItem | undefined>;
  createGroceryItem(item: InsertGroceryItem): Promise<GroceryItem>;
  updateGroceryItem(userId: string, id: number, updates: Partial<InsertGroceryItem>): Promise<GroceryItem>;
  deleteGroceryItem(userId: string, id: number): Promise<void>;
  deleteAllGroceryItems(userId: string): Promise<void>;
  deleteGroceryItemsByMeal(userId: string, mealName: string): Promise<void>;

  // Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings>;

  // Shares
  createShare(share: InsertMealPlanShare): Promise<MealPlanShare>;
  getSharesByOwner(ownerId: string): Promise<MealPlanShare[]>;
  getSharesForUser(userId: string, userEmail: string): Promise<MealPlanShare[]>;
  getShareByToken(token: string): Promise<MealPlanShare | undefined>;
  updateShare(id: number, updates: Partial<InsertMealPlanShare>): Promise<MealPlanShare>;
  deleteShare(ownerId: string, id: number): Promise<void>;
  acceptShare(token: string, userId: string): Promise<MealPlanShare | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Recipes
  async getRecipes(userId: string): Promise<Recipe[]> {
    return await db.select().from(recipes).where(eq(recipes.userId, userId));
  }

  async getRecipe(userId: string, id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
    return recipe;
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db.insert(recipes).values(insertRecipe).returning();
    return recipe;
  }

  async updateRecipe(userId: string, id: number, updates: Partial<InsertRecipe>): Promise<Recipe> {
    const [updated] = await db.update(recipes).set(updates)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId))).returning();
    return updated;
  }

  async deleteRecipe(userId: string, id: number): Promise<void> {
    await db.delete(recipes).where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
  }

  // Meals
  async getMeals(userId: string): Promise<Meal[]> {
    return await db.select().from(meals).where(eq(meals.userId, userId));
  }

  async getMeal(userId: string, id: number): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals)
      .where(and(eq(meals.id, id), eq(meals.userId, userId)));
    return meal;
  }

  async createMeal(insertMeal: InsertMeal): Promise<Meal> {
    const [meal] = await db.insert(meals).values(insertMeal).returning();
    return meal;
  }

  async updateMeal(userId: string, id: number, updates: Partial<InsertMeal>): Promise<Meal> {
    const [updated] = await db.update(meals).set(updates)
      .where(and(eq(meals.id, id), eq(meals.userId, userId))).returning();
    return updated;
  }

  async deleteMeal(userId: string, id: number): Promise<void> {
    await db.delete(meals).where(and(eq(meals.id, id), eq(meals.userId, userId)));
  }

  async deleteAllMeals(userId: string): Promise<void> {
    await db.delete(meals).where(eq(meals.userId, userId));
  }

  // Grocery
  async getGroceryItems(userId: string): Promise<GroceryItem[]> {
    return await db.select().from(groceryItems).where(eq(groceryItems.userId, userId));
  }

  async getGroceryItem(userId: string, id: number): Promise<GroceryItem | undefined> {
    const [item] = await db.select().from(groceryItems)
      .where(and(eq(groceryItems.id, id), eq(groceryItems.userId, userId)));
    return item;
  }

  async createGroceryItem(insertItem: InsertGroceryItem): Promise<GroceryItem> {
    const [item] = await db.insert(groceryItems).values(insertItem).returning();
    return item;
  }

  async updateGroceryItem(userId: string, id: number, updates: Partial<InsertGroceryItem>): Promise<GroceryItem> {
    const [updated] = await db.update(groceryItems).set(updates)
      .where(and(eq(groceryItems.id, id), eq(groceryItems.userId, userId))).returning();
    return updated;
  }

  async deleteGroceryItem(userId: string, id: number): Promise<void> {
    await db.delete(groceryItems).where(and(eq(groceryItems.id, id), eq(groceryItems.userId, userId)));
  }

  async deleteAllGroceryItems(userId: string): Promise<void> {
    await db.delete(groceryItems).where(eq(groceryItems.userId, userId));
  }

  async deleteGroceryItemsByMeal(userId: string, mealName: string): Promise<void> {
    await db.delete(groceryItems)
      .where(and(eq(groceryItems.userId, userId), eq(groceryItems.sourceMeal, mealName)));
  }

  // Settings
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [result] = await db.insert(userSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          workDays: settings.workDays,
          workShift: settings.workShift,
          breakfastDays: settings.breakfastDays,
        },
      })
      .returning();
    return result;
  }

  // Shares
  async createShare(share: InsertMealPlanShare): Promise<MealPlanShare> {
    const [result] = await db.insert(mealPlanShares).values(share).returning();
    return result;
  }

  async getSharesByOwner(ownerId: string): Promise<MealPlanShare[]> {
    return await db.select().from(mealPlanShares).where(eq(mealPlanShares.ownerId, ownerId));
  }

  async getSharesForUser(userId: string, userEmail: string): Promise<MealPlanShare[]> {
    return await db.select().from(mealPlanShares).where(
      and(
        eq(mealPlanShares.status, "accepted"),
        or(
          eq(mealPlanShares.invitedUserId, userId),
          eq(mealPlanShares.invitedEmail, userEmail)
        )
      )
    );
  }

  async getShareByToken(token: string): Promise<MealPlanShare | undefined> {
    const [share] = await db.select().from(mealPlanShares).where(eq(mealPlanShares.shareToken, token));
    return share;
  }

  async updateShare(id: number, updates: Partial<InsertMealPlanShare>): Promise<MealPlanShare> {
    const [updated] = await db.update(mealPlanShares).set(updates)
      .where(eq(mealPlanShares.id, id)).returning();
    return updated;
  }

  async deleteShare(ownerId: string, id: number): Promise<void> {
    await db.delete(mealPlanShares).where(
      and(eq(mealPlanShares.id, id), eq(mealPlanShares.ownerId, ownerId))
    );
  }

  async acceptShare(token: string, userId: string): Promise<MealPlanShare | undefined> {
    const [updated] = await db.update(mealPlanShares)
      .set({ status: "accepted", invitedUserId: userId })
      .where(and(eq(mealPlanShares.shareToken, token), eq(mealPlanShares.status, "pending")))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
