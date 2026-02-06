import type { Express, Request } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { isAuthenticated, getUserId, getUserEmail, setupAuthRoutes } from "./supabase-auth";
import { parseIngredient, isPantryStaple, aggregateIngredients, formatIngredient, categorizeIngredient } from "@shared/ingredient-utils";
import extendedRoutes from "./routes-extended";

const openai = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
}) : null;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup auth routes
  setupAuthRoutes(app);

  // Recipes
  app.get(api.recipes.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const recipes = await storage.getRecipes(userId);
    res.json(recipes);
  });

  app.post(api.recipes.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.recipes.create.input.parse(req.body);
      const recipe = await storage.createRecipe({ ...input, userId });
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

  app.patch(api.recipes.update.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      const input = api.recipes.update.input.parse(req.body);
      const updated = await storage.updateRecipe(userId, id, input);
      if (!updated) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(updated);
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

  app.delete(api.recipes.delete.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    await storage.deleteRecipe(userId, Number(req.params.id));
    res.status(204).send();
  });

  // Scrape recipe from URL (protected)
  app.post(api.scrape.path, isAuthenticated, async (req, res) => {
    try {
      const { url } = api.scrape.input.parse(req.body);
      
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ message: 'Invalid URL', field: 'url' });
      }
      
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ message: 'Only HTTP/HTTPS URLs are allowed', field: 'url' });
      }
      
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
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
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
      
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'Response too large', field: 'url' });
      }
      
      const html = await response.text();
      
      if (html.length > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'Response too large', field: 'url' });
      }
      const $ = cheerio.load(html);
      
      let name: string | undefined;
      let ingredients: string[] = [];
      let instructions: string | undefined;
      
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
      
      if (ingredients.length === 0) {
        $('[class*="ingredient"], [itemprop="recipeIngredient"], .ingredients li, .ingredient-list li').each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length < 200) {
            ingredients.push(text);
          }
        });
      }
      
      // Fallback: Parse ingredients from raw HTML (handles Swedish blogs with <br> separated ingredients)
      if (ingredients.length === 0) {
        // Try multiple patterns for finding ingredient sections
        const patterns = [
          // Pattern 1: "Ingredienser:" header
          /Ingredienser?:?\s*(?:<[^>]*>)?\s*([\s\S]*?)(?:G.r s. h.r|Instruktioner|Tillagning|<strong>\d+\.|Börja med)/i,
          // Pattern 2: After portion info (e.g., "4 port" or "6 portioner")
          /\d+\s*port\.?(?:ioner)?<\/\w+>\s*(?:<[^>]*>)*\s*([\s\S]*?)(?:Börja med|Starta med|Gör så här|Instruktioner|Tillagning)/i,
          // Pattern 3: Content between <em> tags with <br> separators (common blog pattern)
          /<em>(\d+\s*(?:g|dl|msk|tsk|st|burk)[\s\S]*?)<\/em>/i,
        ];
        
        let ingredientBlock = '';
        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            ingredientBlock = match[1];
            break;
          }
        }
        
        if (ingredientBlock) {
          // Decode unicode escapes (e.g., \u00f6 -> ö)
          ingredientBlock = ingredientBlock.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => 
            String.fromCharCode(parseInt(code, 16))
          );
          // Replace literal \n with actual newlines, <br> and <br/> with newlines, strip other HTML tags
          ingredientBlock = ingredientBlock
            .replace(/\\n/g, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&nbsp;/g, ' ')
            .replace(/&auml;/g, 'ä')
            .replace(/&ouml;/g, 'ö')
            .replace(/&aring;/g, 'å');
          
          const lines = ingredientBlock.split(/\n/).map(l => l.trim()).filter(l => l.length > 2 && l.length < 150);
          
          // Common Swedish measurement patterns
          const measurementPattern = /^[\d\.,½¼¾⅓⅔]+\s*(dl|msk|tsk|g|kg|ml|l|st|port|portion|krm)\b|^ca\s*\d|paket|burk|klyfta|knippa/i;
          const ingredientWords = /pasta|ost|lök|vitlök|grädde|ägg|salt|peppar|smör|olja|mjöl|socker|tomat|paprika|kyckling|nötkött|fläsk|potatis|ris|bröd|halloumi|salsiccia|crème|fraiche|buljong/i;
          
          for (const line of lines) {
            // Skip headers and instruction-like lines
            if (line.match(/^(tips|obs|gör så här|instruktioner|\d+\s*port|börja med|starta med)/i)) continue;
            if (line.match(/^\d+\.\s/)) continue; // Numbered instructions
            
            // Check if line looks like an ingredient
            if (measurementPattern.test(line) || ingredientWords.test(line)) {
              const cleaned = line.replace(/\*\*/g, '').replace(/^\*\s*/, '').trim();
              if (cleaned.length > 2 && !ingredients.includes(cleaned)) {
                ingredients.push(cleaned);
              }
            }
          }
        }
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
  app.get(api.meals.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const meals = await storage.getMeals(userId);
    res.json(meals);
  });

  app.post(api.meals.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.meals.create.input.parse(req.body);
      const meal = await storage.createMeal({ ...input, userId });
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

  app.patch(api.meals.update.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      const input = api.meals.update.input.parse(req.body);
      const updated = await storage.updateMeal(userId, id, input);
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

  app.delete(api.meals.delete.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    await storage.deleteMeal(userId, Number(req.params.id));
    res.status(204).send();
  });

  // Grocery
  app.get(api.grocery.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const items = await storage.getGroceryItems(userId);
    res.json(items);
  });

  app.post(api.grocery.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.grocery.create.input.parse(req.body);
      const item = await storage.createGroceryItem({ ...input, userId });
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

  app.patch(api.grocery.update.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      const input = api.grocery.update.input.parse(req.body);
      const updated = await storage.updateGroceryItem(userId, id, input);
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

  app.delete(api.grocery.delete.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    await storage.deleteGroceryItem(userId, Number(req.params.id));
    res.status(204).send();
  });

  // Clear all grocery items
  app.delete('/api/grocery', isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    await storage.deleteAllGroceryItems(userId);
    res.status(204).send();
  });

  // Delete grocery items by meal
  app.delete('/api/grocery/by-meal/:mealName', isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const mealName = decodeURIComponent(req.params.mealName);
    await storage.deleteGroceryItemsByMeal(userId, mealName);
    res.status(204).send();
  });

  // Regenerate grocery list from current meals
  app.post('/api/grocery/regenerate', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { weekStart } = req.body as { weekStart?: string };
      
      // Get all meals and recipes
      const allMeals = await storage.getMeals(userId);
      // Filter meals by weekStart if provided
      const meals = weekStart 
        ? allMeals.filter(m => m.weekStart === weekStart)
        : allMeals;
      const recipes = await storage.getRecipes(userId);
      
      // Collect all ingredients from meals with linked recipes
      const allIngredients: { ingredient: string; sourceMeal: string }[] = [];
      
      for (const meal of meals) {
        if (meal.recipeId) {
          const recipe = recipes.find(r => r.id === meal.recipeId);
          if (recipe && recipe.ingredients) {
            for (const ingredient of recipe.ingredients) {
              // Use recipe name as source, not meal name
              allIngredients.push({ ingredient, sourceMeal: recipe.name });
            }
          }
        }
      }
      
      // Filter out pantry staples
      const filteredIngredients = allIngredients.filter(
        item => !isPantryStaple(item.ingredient)
      );
      
      // Parse all ingredients
      const parsedIngredients = filteredIngredients.map(item => ({
        ...parseIngredient(item.ingredient),
        sourceMeal: item.sourceMeal,
      }));
      
      // Aggregate similar ingredients
      const aggregated = aggregateIngredients(parsedIngredients);
      
      // Clear existing grocery items
      await storage.deleteAllGroceryItems(userId);
      
      // Create new grocery items with proper categorization
      const newItems = [];
      for (const parsed of aggregated) {
        const displayName = formatIngredient(parsed);
        const category = categorizeIngredient(parsed.normalizedName);
        
        const item = await storage.createGroceryItem({
          userId,
          name: displayName,
          normalizedName: parsed.normalizedName,
          quantity: parsed.quantity || 1,
          unit: parsed.unit || null,
          category,
          isBought: false,
          isCustom: false,
          sourceMeal: (parsed as any).sourceMeal || null,
        });
        newItems.push(item);
      }
      
      res.json(newItems);
    } catch (err) {
      console.error('Error regenerating grocery list:', err);
      res.status(500).json({ message: 'Failed to regenerate grocery list' });
    }
  });

  // Add ingredients from a recipe/meal to grocery list
  app.post('/api/grocery/add-ingredients', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { ingredients, sourceMeal } = req.body as { ingredients: string[]; sourceMeal?: string };
      
      if (!ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({ message: 'ingredients array is required' });
      }
      
      // Filter out pantry staples
      const filteredIngredients = ingredients.filter(ing => !isPantryStaple(ing));
      
      // Parse ingredients
      const parsedIngredients = filteredIngredients.map(ing => parseIngredient(ing));
      
      // Get existing grocery items to check for duplicates BEFORE aggregating
      const existingItems = await storage.getGroceryItems(userId);
      
      // Separate into existing and new ingredients
      const toUpdate: Array<{ existing: any; parsed: any }> = [];
      const toCreate: any[] = [];
      
      for (const parsed of parsedIngredients) {
        const existing = existingItems.find(item => 
          item.normalizedName?.toLowerCase() === parsed.normalizedName.toLowerCase() &&
          (item.unit || '').toLowerCase() === (parsed.unit || '').toLowerCase()
        );
        
        if (existing) {
          toUpdate.push({ existing, parsed });
        } else {
          toCreate.push(parsed);
        }
      }
      
      // Aggregate only the new items to create
      const aggregated = aggregateIngredients(toCreate);
      
      // Create or update grocery items
      const newItems = [];
      
      // Update existing items
      for (const { existing, parsed } of toUpdate) {
        const newQuantity = (existing.quantity || 1) + Math.round(parsed.quantity || 1);
        const updatedSourceMeal = sourceMeal && existing.sourceMeal !== sourceMeal
          ? `${existing.sourceMeal || ''}, ${sourceMeal}`.replace(/^, /, '')
          : existing.sourceMeal || sourceMeal || null;
        
        const displayName = formatIngredient({ ...parsed, quantity: newQuantity });
        const updated = await storage.updateGroceryItem(userId, existing.id, {
          quantity: newQuantity,
          sourceMeal: updatedSourceMeal,
          name: displayName,
        });
        newItems.push(updated);
      }
      
      // Create new items from aggregated
      for (const parsed of aggregated) {
        const displayName = formatIngredient(parsed);
        const category = categorizeIngredient(parsed.normalizedName);
        
        const item = await storage.createGroceryItem({
          userId,
          name: displayName,
          normalizedName: parsed.normalizedName,
          quantity: parsed.quantity || 1,
          unit: parsed.unit || null,
          category,
          isBought: false,
          isCustom: false,
          sourceMeal: sourceMeal || null,
        });
        newItems.push(item);
      }
      
      res.json(newItems);
    } catch (err) {
      console.error('Error adding ingredients:', err);
      res.status(500).json({ message: 'Failed to add ingredients' });
    }
  });

  // User Settings
  app.get('/api/settings', isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const settings = await storage.getUserSettings(userId);
    if (settings) {
      res.json(settings);
    } else {
      res.json({
        userId,
        workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        workShift: "day",
        breakfastDays: [],
      });
    }
  });

  app.put('/api/settings', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { workDays, workShift, breakfastDays } = req.body;
      const settings = await storage.upsertUserSettings({
        userId,
        workDays: workDays || [],
        workShift: workShift || 'day',
        breakfastDays: breakfastDays || [],
      });
      res.json(settings);
    } catch (err) {
      console.error('Settings error:', err);
      res.status(500).json({ message: 'Failed to save settings' });
    }
  });

  // Scan recipe from photo using AI vision (protected)
  app.post('/api/scan-recipe', isAuthenticated, async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ message: 'Image is required', field: 'image' });
      }

      if (!openai) {
        return res.status(503).json({ message: 'AI service not configured', field: 'image' });
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a precise OCR system for Swedish recipe books. Read this recipe image and extract EXACTLY what is written.

Return JSON format:
{
  "name": "Recipe name exactly as written",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": "Instructions exactly as written"
}

CRITICAL RULES FOR INGREDIENTS:
- Include EVERY ingredient from ALL sections (main ingredients, "Topping:", "Garnering:", etc.)
- For section headers like "Topping:", include them as a label, e.g., "--- Topping ---"
- Read quantities EXACTLY: "50 g" not "30 g", "1 dl" not "0.5 dl", "9%" not "3%"
- Keep ALL descriptors: "sockerfritt" (sugar-free), "extra hallon", "lite salt"
- Include portion info like "1 portion" as the first ingredient if present
- Do NOT summarize or shorten - copy exactly what you see

If you cannot read something clearly, write "[oläsligt]" instead of guessing.
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
      
      let parsed;
      try {
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

  // ========== Sharing Routes ==========

  // Get my shares (invites I've sent)
  app.get('/api/shares', isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const shares = await storage.getSharesByOwner(userId);
    res.json(shares);
  });

  // Get shared with me (plans others have shared with me - accepted only)
  app.get('/api/shares/received', isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const userEmail = getUserEmail(req);
    const shares = await storage.getSharesForUser(userId, userEmail);
    res.json(shares);
  });

  // Get pending invitations for this user
  app.get('/api/shares/pending', isAuthenticated, async (req, res) => {
    const userEmail = getUserEmail(req);
    if (!userEmail) {
      return res.json([]);
    }
    const shares = await storage.getPendingSharesForUser(userEmail.toLowerCase());
    res.json(shares);
  });

  // Accept a share by ID
  app.post('/api/shares/:id/accept', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.id);
      
      // Verify this invitation is for this user
      const pendingShares = await storage.getPendingSharesForUser(userEmail.toLowerCase());
      const share = pendingShares.find(s => s.id === shareId);
      
      if (!share) {
        return res.status(404).json({ message: 'Invitation not found' });
      }
      
      const updated = await storage.acceptShareById(shareId, userId);
      if (!updated) {
        return res.status(400).json({ message: 'Failed to accept invitation' });
      }
      res.json(updated);
    } catch (err) {
      console.error('Accept share error:', err);
      res.status(500).json({ message: 'Failed to accept invitation' });
    }
  });

  // Decline a share invitation
  app.post('/api/shares/:id/decline', isAuthenticated, async (req, res) => {
    try {
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.id);
      
      // Verify this invitation is for this user
      const pendingShares = await storage.getPendingSharesForUser(userEmail.toLowerCase());
      const share = pendingShares.find(s => s.id === shareId);
      
      if (!share) {
        return res.status(404).json({ message: 'Invitation not found' });
      }
      
      // Use declineShare which directly deletes by ID
      await storage.declineShare(shareId);
      res.status(204).send();
    } catch (err) {
      console.error('Decline share error:', err);
      res.status(500).json({ message: 'Failed to decline invitation' });
    }
  });

  // Create a share invite
  app.post('/api/shares', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userName = req.user?.email || 'Unknown';
      const { email, permission } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      const share = await storage.createShare({
        ownerId: userId,
        ownerName: userName,
        invitedEmail: email.toLowerCase().trim(),
        permission: permission || 'view',
        status: 'pending',
        shareToken: randomUUID(),
        createdAt: new Date().toISOString(),
      });
      
      res.status(201).json(share);
    } catch (err) {
      console.error('Share error:', err);
      res.status(500).json({ message: 'Failed to create share' });
    }
  });

  // Accept a share invite by token
  app.post('/api/shares/accept/:token', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const { token } = req.params;
      
      const share = await storage.getShareByToken(token);
      if (!share) {
        return res.status(404).json({ message: 'Share not found or already accepted' });
      }
      
      if (share.status !== 'pending') {
        return res.status(400).json({ message: 'This invite has already been used' });
      }
      
      const updated = await storage.acceptShare(token, userId);
      
      // Create reciprocal share for bidirectional access
      // This allows both users to see each other's data
      try {
        const reciprocalShare = await storage.createShare({
          ownerId: userId, // The person accepting becomes the owner of the reciprocal share
          ownerName: userEmail,
          invitedEmail: share.ownerName, // Invite the original owner back
          permission: share.permission, // Use same permission level
          status: 'pending',
          shareToken: randomUUID(),
          createdAt: new Date().toISOString(),
        });
        
        // Auto-accept the reciprocal share for the original owner
        await storage.acceptShare(reciprocalShare.shareToken, share.ownerId);
        console.log(`Bidirectional share created: ${userId} <-> ${share.ownerId}`);
      } catch (reciprocalErr) {
        // Don't fail the original acceptance if reciprocal creation fails
        console.error('Failed to create reciprocal share:', reciprocalErr);
      }
      
      res.json(updated);
    } catch (err) {
      console.error('Accept share error:', err);
      res.status(500).json({ message: 'Failed to accept share' });
    }
  });

  // Revoke/delete a share (owner only)
  app.delete('/api/shares/:id', isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    await storage.deleteShare(userId, Number(req.params.id));
    res.status(204).send();
  });

  // Get shared plan meals (for viewing someone else's plan)
  // Security: Only returns meals if user is an accepted invitee with matching userId/email
  app.get('/api/shares/:shareId/meals', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      
      // Get only accepted shares where this user is the invitee (by userId or email)
      // This is enforced server-side - getSharesForUser only returns accepted shares
      // where invitedUserId matches or invitedEmail matches
      const myShares = await storage.getSharesForUser(userId, userEmail);
      const share = myShares.find(s => s.id === shareId);
      
      if (!share) {
        // Log unauthorized access attempts for security monitoring
        console.warn(`Unauthorized share access attempt: user=${userId} shareId=${shareId}`);
        return res.status(403).json({ message: 'You do not have access to this plan' });
      }
      
      // Double-check share status (defense in depth)
      if (share.status !== 'accepted') {
        return res.status(403).json({ message: 'Share not yet accepted' });
      }
      
      // Get the owner's meals - safe because we verified authorization above
      const meals = await storage.getMeals(share.ownerId);
      res.json(meals);
    } catch (err) {
      console.error('Get shared meals error:', err);
      res.status(500).json({ message: 'Failed to fetch shared meals' });
    }
  });

  // Get shared plan recipes
  app.get('/api/shares/:shareId/recipes', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      
      const myShares = await storage.getSharesForUser(userId, userEmail);
      const share = myShares.find(s => s.id === shareId);
      
      if (!share || share.status !== 'accepted') {
        return res.status(403).json({ message: 'You do not have access to this plan' });
      }
      
      const recipes = await storage.getRecipes(share.ownerId);
      res.json(recipes);
    } catch (err) {
      console.error('Get shared recipes error:', err);
      res.status(500).json({ message: 'Failed to fetch shared recipes' });
    }
  });

  // Get shared plan grocery list
  app.get('/api/shares/:shareId/grocery', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      
      const myShares = await storage.getSharesForUser(userId, userEmail);
      const share = myShares.find(s => s.id === shareId);
      
      if (!share || share.status !== 'accepted') {
        return res.status(403).json({ message: 'You do not have access to this plan' });
      }
      
      const groceryItems = await storage.getGroceryItems(share.ownerId);
      res.json(groceryItems);
    } catch (err) {
      console.error('Get shared grocery error:', err);
      res.status(500).json({ message: 'Failed to fetch shared grocery' });
    }
  });

  // Get shared plan settings
  app.get('/api/shares/:shareId/settings', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      
      const myShares = await storage.getSharesForUser(userId, userEmail);
      const share = myShares.find(s => s.id === shareId);
      
      if (!share || share.status !== 'accepted') {
        return res.status(403).json({ message: 'You do not have access to this plan' });
      }
      
      const settings = await storage.getUserSettings(share.ownerId);
      res.json(settings);
    } catch (err) {
      console.error('Get shared settings error:', err);
      res.status(500).json({ message: 'Failed to fetch shared settings' });
    }
  });

  // Helper to verify edit permission on share
  async function verifyShareEditPermission(userId: string, userEmail: string, shareId: number) {
    const myShares = await storage.getSharesForUser(userId, userEmail);
    const share = myShares.find(s => s.id === shareId);
    if (!share || share.status !== 'accepted') {
      return { error: 'You do not have access to this plan', share: null };
    }
    if (share.permission !== 'edit') {
      return { error: 'You do not have edit permission', share: null };
    }
    return { error: null, share };
  }

  // Create meal on shared plan (edit permission required)
  app.post('/api/shares/:shareId/meals', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      
      const { error, share } = await verifyShareEditPermission(userId, userEmail, shareId);
      if (error || !share) {
        return res.status(403).json({ message: error });
      }
      
      const input = api.meals.create.input.parse(req.body);
      const meal = await storage.createMeal({ ...input, userId: share.ownerId });
      res.status(201).json(meal);
    } catch (err) {
      console.error('Create shared meal error:', err);
      res.status(500).json({ message: 'Failed to create meal' });
    }
  });

  // Update meal on shared plan (edit permission required)
  app.patch('/api/shares/:shareId/meals/:mealId', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      const mealId = Number(req.params.mealId);
      
      const { error, share } = await verifyShareEditPermission(userId, userEmail, shareId);
      if (error || !share) {
        return res.status(403).json({ message: error });
      }
      
      const input = api.meals.update.input.parse(req.body);
      const updated = await storage.updateMeal(share.ownerId, mealId, input);
      if (!updated) {
        return res.status(404).json({ message: 'Meal not found' });
      }
      res.json(updated);
    } catch (err) {
      console.error('Update shared meal error:', err);
      res.status(500).json({ message: 'Failed to update meal' });
    }
  });

  // Delete meal on shared plan (edit permission required)
  app.delete('/api/shares/:shareId/meals/:mealId', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      const mealId = Number(req.params.mealId);
      
      const { error, share } = await verifyShareEditPermission(userId, userEmail, shareId);
      if (error || !share) {
        return res.status(403).json({ message: error });
      }
      
      await storage.deleteMeal(share.ownerId, mealId);
      res.status(204).send();
    } catch (err) {
      console.error('Delete shared meal error:', err);
      res.status(500).json({ message: 'Failed to delete meal' });
    }
  });

  // Create recipe on shared plan (edit permission required)
  app.post('/api/shares/:shareId/recipes', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      
      const { error, share } = await verifyShareEditPermission(userId, userEmail, shareId);
      if (error || !share) {
        return res.status(403).json({ message: error });
      }
      
      const input = api.recipes.create.input.parse(req.body);
      const recipe = await storage.createRecipe({ ...input, userId: share.ownerId });
      res.status(201).json(recipe);
    } catch (err) {
      console.error('Create shared recipe error:', err);
      res.status(500).json({ message: 'Failed to create recipe' });
    }
  });

  // Update grocery item on shared plan (edit permission required)
  app.patch('/api/shares/:shareId/grocery/:itemId', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      const itemId = Number(req.params.itemId);
      
      const { error, share } = await verifyShareEditPermission(userId, userEmail, shareId);
      if (error || !share) {
        return res.status(403).json({ message: error });
      }
      
      const input = api.grocery.update.input.parse(req.body);
      const updated = await storage.updateGroceryItem(share.ownerId, itemId, input);
      if (!updated) {
        return res.status(404).json({ message: 'Item not found' });
      }
      res.json(updated);
    } catch (err) {
      console.error('Update shared grocery error:', err);
      res.status(500).json({ message: 'Failed to update item' });
    }
  });

  // Add grocery item to shared plan (edit permission required)
  // Add parsed ingredients to shared grocery list (proper aggregation and filtering)
  app.post('/api/shares/:shareId/grocery/add-ingredients', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      
      const { error, share } = await verifyShareEditPermission(userId, userEmail, shareId);
      if (error || !share) {
        console.error('Share edit permission denied:', error);
        return res.status(403).json({ message: error });
      }
      
      const { ingredients, sourceMeal } = req.body as { ingredients: string[]; sourceMeal?: string };
      
      if (!ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({ message: 'ingredients array is required' });
      }
      
      // Filter out pantry staples
      const filteredIngredients = ingredients.filter(ing => !isPantryStaple(ing));
      
      // Parse ingredients
      const parsedIngredients = filteredIngredients.map(ing => parseIngredient(ing));
      
      // Get existing grocery items to check for duplicates BEFORE aggregating
      const existingItems = await storage.getGroceryItems(share.ownerId);
      
      // Separate into existing and new ingredients
      const toUpdate: Array<{ existing: any; parsed: any }> = [];
      const toCreate: any[] = [];
      
      for (const parsed of parsedIngredients) {
        const existing = existingItems.find(item => 
          item.normalizedName?.toLowerCase() === parsed.normalizedName.toLowerCase() &&
          (item.unit || '').toLowerCase() === (parsed.unit || '').toLowerCase()
        );
        
        if (existing) {
          toUpdate.push({ existing, parsed });
        } else {
          toCreate.push(parsed);
        }
      }
      
      // Aggregate only the new items to create
      const aggregated = aggregateIngredients(toCreate);
      
      // Create or update grocery items
      const newItems = [];
      
      // Update existing items
      for (const { existing, parsed } of toUpdate) {
        const newQuantity = (existing.quantity || 1) + Math.round(parsed.quantity || 1);
        const updatedSourceMeal = sourceMeal && existing.sourceMeal !== sourceMeal
          ? `${existing.sourceMeal || ''}, ${sourceMeal}`.replace(/^, /, '')
          : existing.sourceMeal || sourceMeal || null;
        
        const displayName = formatIngredient({ ...parsed, quantity: newQuantity });
        const updated = await storage.updateGroceryItem(share.ownerId, existing.id, {
          quantity: newQuantity,
          sourceMeal: updatedSourceMeal,
          name: displayName,
        });
        newItems.push(updated);
      }
      
      // Create new items from aggregated
      for (const parsed of aggregated) {
        const displayName = formatIngredient(parsed);
        const category = categorizeIngredient(parsed.normalizedName);
        
        const item = await storage.createGroceryItem({
          userId: share.ownerId,
          name: displayName,
          normalizedName: parsed.normalizedName,
          quantity: parsed.quantity || 1,
          unit: parsed.unit || null,
          category,
          isBought: false,
          isCustom: false,
          sourceMeal: sourceMeal || null,
        });
        newItems.push(item);
      }
      
      res.json(newItems);
    } catch (err) {
      console.error('Error adding ingredients to shared list:', err);
      res.status(500).json({ message: 'Failed to add ingredients' });
    }
  });

  app.post('/api/shares/:shareId/grocery', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      
      const { error, share } = await verifyShareEditPermission(userId, userEmail, shareId);
      if (error || !share) {
        console.error('Share edit permission denied:', error, 'userId:', userId, 'shareId:', shareId);
        return res.status(403).json({ message: error });
      }
      
      const input = api.grocery.create.input.parse(req.body);
      // Ensure categorization happens if not provided
      if (!input.category && input.name) {
        input.category = categorizeIngredient(input.normalizedName || input.name);
      }
      const created = await storage.createGroceryItem({ ...input, userId: share.ownerId });
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error('[POST grocery] Zod validation error:', err.errors);
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('❌ [POST grocery] Unexpected error:', err);
      res.status(500).json({ message: 'Failed to add item' });
    }
  });

  // Delete grocery item from shared plan (edit permission required)
  app.delete('/api/shares/:shareId/grocery/:itemId', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      const itemId = Number(req.params.itemId);
      
      const { error, share } = await verifyShareEditPermission(userId, userEmail, shareId);
      if (error || !share) {
        console.error('[DELETE grocery] Permission denied:', error);
        return res.status(403).json({ message: error });
      }
      
      await storage.deleteGroceryItem(share.ownerId, itemId);
      res.status(204).send();
    } catch (err) {
      console.error('❌ [DELETE grocery] Error:', err);
      res.status(500).json({ message: 'Failed to delete item' });
    }
  });

  // Delete grocery items by meal from shared plan (edit permission required)
  app.delete('/api/shares/:shareId/grocery/by-meal/:mealName', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      const mealName = decodeURIComponent(req.params.mealName);
      
      const { error, share } = await verifyShareEditPermission(userId, userEmail, shareId);
      if (error || !share) {
        console.error('[DELETE by-meal] Permission denied:', error);
        return res.status(403).json({ message: error });
      }
      
      await storage.deleteGroceryItemsByMeal(share.ownerId, mealName);
      res.status(204).send();
    } catch (err) {
      console.error('❌ [DELETE by-meal] Error:', err);
      res.status(500).json({ message: 'Failed to delete items by meal' });
    }
  });

  // Clear all grocery items from shared plan (edit permission required)
  app.delete('/api/shares/:shareId/grocery', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      
      const { error, share } = await verifyShareEditPermission(userId, userEmail, shareId);
      if (error || !share) {
        console.error('[DELETE all grocery] Permission denied:', error);
        return res.status(403).json({ message: error });
      }
      
      await storage.deleteAllGroceryItems(share.ownerId);
      res.status(204).send();
    } catch (err) {
      console.error('❌ [DELETE all grocery] Error:', err);
      res.status(500).json({ message: 'Failed to clear grocery list' });
    }
  });

  // Regenerate grocery list from shared plan meals (edit permission required)
  app.post('/api/shares/:shareId/grocery/regenerate', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userEmail = getUserEmail(req);
      const shareId = Number(req.params.shareId);
      
      const { error, share } = await verifyShareEditPermission(userId, userEmail, shareId);
      if (error || !share) {
        console.error('[Regenerate grocery] Permission denied:', error);
        return res.status(403).json({ message: error });
      }
      
      const { weekStart } = req.body as { weekStart?: string };
      
      // Get all meals and recipes for the owner
      const allMeals = await storage.getMeals(share.ownerId);
      // Filter meals by weekStart if provided
      const meals = weekStart 
        ? allMeals.filter(m => m.weekStart === weekStart)
        : allMeals;
      const recipes = await storage.getRecipes(share.ownerId);
      
      // Collect all ingredients from meals with linked recipes
      const allIngredients: { ingredient: string; sourceMeal: string }[] = [];
      
      for (const meal of meals) {
        if (meal.recipeId) {
          const recipe = recipes.find(r => r.id === meal.recipeId);
          if (recipe && recipe.ingredients) {
            for (const ingredient of recipe.ingredients) {
              // Use recipe name as source, not meal name
              allIngredients.push({ ingredient, sourceMeal: recipe.name });
            }
          }
        }
      }
      
      // Filter out pantry staples
      const filteredIngredients = allIngredients.filter(
        item => !isPantryStaple(item.ingredient)
      );
      
      // Parse all ingredients
      const parsedIngredients = filteredIngredients.map(item => ({
        ...parseIngredient(item.ingredient),
        sourceMeal: item.sourceMeal,
      }));
      
      // Aggregate similar ingredients
      const aggregated = aggregateIngredients(parsedIngredients);
      
      // Clear existing grocery items
      await storage.deleteAllGroceryItems(share.ownerId);
      
      // Create new grocery items with proper categorization
      const newItems = [];
      for (const parsed of aggregated) {
        const displayName = formatIngredient(parsed);
        const category = categorizeIngredient(parsed.normalizedName);
        
        const item = await storage.createGroceryItem({
          userId: share.ownerId,
          name: displayName,
          normalizedName: parsed.normalizedName,
          quantity: parsed.quantity || 1,
          unit: parsed.unit || null,
          category,
          isBought: false,
          isCustom: false,
          sourceMeal: (parsed as any).sourceMeal || null,
        });
        newItems.push(item);
      }
      
      res.json(newItems);
    } catch (err) {
      console.error('Error regenerating shared grocery list:', err);
      res.status(500).json({ message: 'Failed to regenerate grocery list' });
    }
  });

  // Week History routes
  app.get('/api/week-history', isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const history = await storage.getWeekHistory(userId);
    res.json(history);
  });

  app.get('/api/week-history/:weekStart', isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const week = await storage.getWeekHistoryByWeek(userId, req.params.weekStart);
    if (!week) {
      return res.status(404).json({ message: 'Week not found' });
    }
    res.json(week);
  });

  app.post('/api/week-history/archive', isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const { weekStart } = req.body;
    if (!weekStart) {
      return res.status(400).json({ message: 'weekStart is required' });
    }
    const currentMeals = await storage.getMeals(userId);
    const archived = await storage.archiveWeek(userId, weekStart, currentMeals);
    res.json(archived);
  });

  // Account deletion
  app.delete('/api/account', isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    await storage.deleteUserData(userId);
    res.status(204).send();
  });

  // Extended routes for linked accounts and enhanced grocery features
  app.use(extendedRoutes);

  // Global error handler for async routes
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled error in route:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return httpServer;
}

