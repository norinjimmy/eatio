import { db } from "./db";
import { supabase } from "./supabase";
import { recipes, meals, groceryItems, userSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

async function migrateData() {
  console.log("Starting data migration from SQLite to Supabase...");

  try {
    // Migrate recipes
    console.log("\nMigrating recipes...");
    const sqliteRecipes = await db.select().from(recipes);
    console.log(`Found ${sqliteRecipes.length} recipes in SQLite`);
    
    for (const recipe of sqliteRecipes) {
      const { error } = await supabase
        .from('recipes')
        .insert({
          user_id: recipe.userId,
          name: recipe.name,
          url: recipe.url,
          ingredients: JSON.parse(recipe.ingredients as any),
          instructions: recipe.instructions,
          is_favorite: recipe.isFavorite,
          usage_count: recipe.usageCount,
        });
      
      if (error) {
        console.error(`Failed to migrate recipe "${recipe.name}":`, error);
      } else {
        console.log(`✓ Migrated recipe: ${recipe.name}`);
      }
    }

    // Migrate meals
    console.log("\nMigrating meals...");
    const sqliteMeals = await db.select().from(meals);
    console.log(`Found ${sqliteMeals.length} meals in SQLite`);
    
    for (const meal of sqliteMeals) {
      const { error } = await supabase
        .from('meals')
        .insert({
          user_id: meal.userId,
          day: meal.day,
          type: meal.type,
          name: meal.name,
          notes: meal.notes,
          recipe_id: meal.recipeId,
          week_start: meal.weekStart,
        });
      
      if (error) {
        console.error(`Failed to migrate meal "${meal.name}":`, error);
      } else {
        console.log(`✓ Migrated meal: ${meal.name} (${meal.day})`);
      }
    }

    // Migrate grocery items
    console.log("\nMigrating grocery items...");
    const sqliteGrocery = await db.select().from(groceryItems);
    console.log(`Found ${sqliteGrocery.length} grocery items in SQLite`);
    
    for (const item of sqliteGrocery) {
      const { error } = await supabase
        .from('grocery_items')
        .insert({
          user_id: item.userId,
          name: item.name,
          normalized_name: item.normalizedName,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          is_bought: item.isBought,
          is_custom: item.isCustom,
          source_meal: item.sourceMeal,
        });
      
      if (error) {
        console.error(`Failed to migrate grocery item "${item.name}":`, error);
      } else {
        console.log(`✓ Migrated grocery item: ${item.name}`);
      }
    }

    // Migrate user settings
    console.log("\nMigrating user settings...");
    const sqliteSettings = await db.select().from(userSettings);
    console.log(`Found ${sqliteSettings.length} user settings in SQLite`);
    
    for (const settings of sqliteSettings) {
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: settings.userId,
          work_days: JSON.parse(settings.workDays as any),
          work_shift: settings.workShift,
          breakfast_days: JSON.parse(settings.breakfastDays as any),
        });
      
      if (error) {
        console.error(`Failed to migrate settings for user "${settings.userId}":`, error);
      } else {
        console.log(`✓ Migrated settings for user: ${settings.userId}`);
      }
    }

    console.log("\n✅ Migration completed successfully!");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateData();
