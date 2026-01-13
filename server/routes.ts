import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as cheerio from "cheerio";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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
      
      // Security: Validate URL protocol and block internal addresses
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ message: 'Invalid URL', field: 'url' });
      }
      
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ message: 'Only HTTP/HTTPS URLs are allowed', field: 'url' });
      }
      
      // Block localhost, private IPs, and internal hostnames
      const hostname = parsedUrl.hostname.toLowerCase();
      const blockedPatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        /^192\.168\./,
        /^0\./,
        /^169\.254\./,
        /^::1$/,
        /^fc00:/i,
        /^fe80:/i,
        /\.local$/i,
        /\.internal$/i,
      ];
      
      if (blockedPatterns.some(pattern => pattern.test(hostname))) {
        return res.status(400).json({ message: 'Internal URLs are not allowed', field: 'url' });
      }
      
      // Fetch with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        return res.status(400).json({ message: 'Could not fetch URL', field: 'url' });
      }
      
      // Limit response size to 5MB to prevent memory exhaustion
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'Response too large', field: 'url' });
      }
      
      const html = await response.text();
      
      // Additional size check after reading
      if (html.length > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'Response too large', field: 'url' });
      }
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

  // Scan recipe from photo using AI vision
  app.post('/api/scan-recipe', async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ message: 'Image is required', field: 'image' });
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a precise OCR system. Read this recipe image and extract EXACTLY what is written. Do not guess or approximate - read the exact text.

Return JSON format:
{
  "name": "Recipe name exactly as written",
  "ingredients": ["ingredient 1 with exact quantity", "ingredient 2 with exact quantity", ...],
  "instructions": "Instructions exactly as written"
}

CRITICAL RULES:
- Read quantities EXACTLY as written (e.g., "50 g" not "30 g", "1 dl" not "0.5 dl")
- Include ALL ingredients, including toppings and garnishes
- Keep percentages exact (e.g., "9%" not "3%")
- Keep descriptors like "sockerfritt" (sugar-free), "extra", "lite" (a little)
- If there are sections like "Topping:" include those ingredients too
- Keep the original Swedish text exactly as written
- If you cannot read something, write "[oläsligt]" instead of guessing

Only return the JSON, no other text.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Try to parse the JSON from the response
      let parsed;
      try {
        // Remove markdown code blocks if present
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(jsonStr);
      } catch {
        return res.status(400).json({ 
          message: 'Could not parse recipe from image', 
          field: 'image' 
        });
      }

      res.json({
        name: parsed.name || '',
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        instructions: parsed.instructions || ''
      });
    } catch (err) {
      console.error('Recipe scan error:', err);
      res.status(500).json({ message: 'Failed to analyze recipe image', field: 'image' });
    }
  });

  return httpServer;
}
