import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as cheerio from "cheerio";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Recipes
  app.get(api.recipes.list.path, async (req, res) => {
    const recipes = await storage.getRecipes();
    res.json(recipes);
  });

  app.post(api.recipes.create.path, async (req, res) => {
    try {
      const input = api.recipes.create.input.parse(req.body);
      const recipe = await storage.createRecipe(input);
      res.status(201).json(recipe);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.recipes.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.recipes.update.input.parse(req.body);
      const updated = await storage.updateRecipe(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(404).json({ message: "Recipe not found" });
    }
  });

  app.delete(api.recipes.delete.path, async (req, res) => {
    await storage.deleteRecipe(Number(req.params.id));
    res.status(204).send();
  });

  // Scrape recipe from URL
  app.post(api.scrape.path, async (req, res) => {
    try {
      const { url } = api.scrape.input.parse(req.body);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      
      if (!response.ok) {
        return res.status(400).json({ message: 'Could not fetch URL', field: 'url' });
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      let name: string | undefined;
      let ingredients: string[] = [];
      let instructions: string | undefined;
      
      // Try to find JSON-LD structured data first (most reliable)
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || '');
          const recipes = Array.isArray(json) ? json : [json];
          
          for (const item of recipes) {
            const recipe = item['@type'] === 'Recipe' ? item : 
                          item['@graph']?.find((g: any) => g['@type'] === 'Recipe');
            
            if (recipe) {
              name = recipe.name;
              
              if (recipe.recipeIngredient) {
                ingredients = recipe.recipeIngredient.map((i: string) => i.trim());
              }
              
              if (recipe.recipeInstructions) {
                if (typeof recipe.recipeInstructions === 'string') {
                  instructions = recipe.recipeInstructions;
                } else if (Array.isArray(recipe.recipeInstructions)) {
                  instructions = recipe.recipeInstructions
                    .map((step: any) => typeof step === 'string' ? step : step.text)
                    .filter(Boolean)
                    .join('\n\n');
                }
              }
              break;
            }
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      });
      
      // Fallback: try common HTML patterns if no structured data
      if (ingredients.length === 0) {
        $('[class*="ingredient"], [itemprop="recipeIngredient"], .ingredients li, .ingredient-list li').each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length < 200) {
            ingredients.push(text);
          }
        });
      }
      
      if (!name) {
        name = $('h1').first().text().trim() || 
               $('[itemprop="name"]').first().text().trim() ||
               $('title').text().split('|')[0].split('-')[0].trim();
      }
      
      res.json({ name, ingredients, instructions });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Scrape error:', err);
      res.status(400).json({ message: 'Failed to parse recipe from URL', field: 'url' });
    }
  });

  // Meals
  app.get(api.meals.list.path, async (req, res) => {
    const meals = await storage.getMeals();
    res.json(meals);
  });

  app.post(api.meals.create.path, async (req, res) => {
    try {
      const input = api.meals.create.input.parse(req.body);
      const meal = await storage.createMeal(input);
      res.status(201).json(meal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.meals.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.meals.update.input.parse(req.body);
      const updated = await storage.updateMeal(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(404).json({ message: "Meal not found" });
    }
  });

  app.delete(api.meals.delete.path, async (req, res) => {
    await storage.deleteMeal(Number(req.params.id));
    res.status(204).send();
  });

  // Grocery
  app.get(api.grocery.list.path, async (req, res) => {
    const items = await storage.getGroceryItems();
    res.json(items);
  });

  app.post(api.grocery.create.path, async (req, res) => {
    try {
      const input = api.grocery.create.input.parse(req.body);
      const item = await storage.createGroceryItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.grocery.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.grocery.update.input.parse(req.body);
      const updated = await storage.updateGroceryItem(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(404).json({ message: "Grocery item not found" });
    }
  });

  app.delete(api.grocery.delete.path, async (req, res) => {
    await storage.deleteGroceryItem(Number(req.params.id));
    res.status(204).send();
  });

  return httpServer;
}
