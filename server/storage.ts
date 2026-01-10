import { db } from "./db";
import {
  recipes, meals, groceryItems,
  type Recipe, type InsertRecipe,
  type Meal, type InsertMeal,
  type GroceryItem, type InsertGroceryItem
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Recipes
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, updates: Partial<InsertRecipe>): Promise<Recipe>;
  deleteRecipe(id: number): Promise<void>;

  // Meals
  getMeals(): Promise<Meal[]>;
  getMeal(id: number): Promise<Meal | undefined>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  updateMeal(id: number, updates: Partial<InsertMeal>): Promise<Meal>;
  deleteMeal(id: number): Promise<void>;

  // Grocery
  getGroceryItems(): Promise<GroceryItem[]>;
  getGroceryItem(id: number): Promise<GroceryItem | undefined>;
  createGroceryItem(item: InsertGroceryItem): Promise<GroceryItem>;
  updateGroceryItem(id: number, updates: Partial<InsertGroceryItem>): Promise<GroceryItem>;
  deleteGroceryItem(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Recipes
  async getRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes);
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db.insert(recipes).values(insertRecipe).returning();
    return recipe;
  }

  async updateRecipe(id: number, updates: Partial<InsertRecipe>): Promise<Recipe> {
    const [updated] = await db.update(recipes).set(updates).where(eq(recipes.id, id)).returning();
    return updated;
  }

  async deleteRecipe(id: number): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  // Meals
  async getMeals(): Promise<Meal[]> {
    return await db.select().from(meals);
  }

  async getMeal(id: number): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, id));
    return meal;
  }

  async createMeal(insertMeal: InsertMeal): Promise<Meal> {
    const [meal] = await db.insert(meals).values(insertMeal).returning();
    return meal;
  }

  async updateMeal(id: number, updates: Partial<InsertMeal>): Promise<Meal> {
    const [updated] = await db.update(meals).set(updates).where(eq(meals.id, id)).returning();
    return updated;
  }

  async deleteMeal(id: number): Promise<void> {
    await db.delete(meals).where(eq(meals.id, id));
  }

  // Grocery
  async getGroceryItems(): Promise<GroceryItem[]> {
    return await db.select().from(groceryItems);
  }

  async getGroceryItem(id: number): Promise<GroceryItem | undefined> {
    const [item] = await db.select().from(groceryItems).where(eq(groceryItems.id, id));
    return item;
  }

  async createGroceryItem(insertItem: InsertGroceryItem): Promise<GroceryItem> {
    const [item] = await db.insert(groceryItems).values(insertItem).returning();
    return item;
  }

  async updateGroceryItem(id: number, updates: Partial<InsertGroceryItem>): Promise<GroceryItem> {
    const [updated] = await db.update(groceryItems).set(updates).where(eq(groceryItems.id, id)).returning();
    return updated;
  }

  async deleteGroceryItem(id: number): Promise<void> {
    await db.delete(groceryItems).where(eq(groceryItems.id, id));
  }
}

export const storage = new DatabaseStorage();
