import { Router } from 'express';
import type { Request, Response } from 'express';
import { isAuthenticated, getUserId } from './supabase-auth';
import { storage } from './storage-supabase';
import { supabaseAdmin } from './supabase';
import {
  getEffectiveUserId,
  getLinkedAccounts,
  isLinkedUser,
  getPrimaryUserInfo,
  createAccountLink,
  removeAccountLink,
} from './linked-accounts';
import { parseIngredient, formatIngredient, categorizeIngredient, aggregateIngredients } from '../shared/ingredient-utils.js';

const router = Router();

// ========================================
// Linked Accounts Endpoints
// ========================================

// Get current user's linked account status
router.get('/api/account/link-status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    // Check if user is a secondary (linked) user
    const primaryInfo = await getPrimaryUserInfo(userId);
    
    if (primaryInfo) {
      return res.json({
        isLinked: true,
        isPrimary: false,
        linkedTo: primaryInfo,
      });
    }

    // Check if user has linked accounts (is primary with secondaries)
    const linkedAccounts = await getLinkedAccounts(userId);
    
    // Get email addresses for linked users
    const linkedUsersWithEmail = await Promise.all(
      linkedAccounts.map(async (link: any) => {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(link.secondary_user_id);
        return {
          id: link.secondary_user_id,
          email: user?.email || 'Unknown',
        };
      })
    );
    
    res.json({
      isLinked: linkedAccounts.length > 0,
      isPrimary: true,
      linkedUsers: linkedUsersWithEmail,
    });
  } catch (error) {
    console.error('Error getting link status:', error);
    res.status(500).json({ message: 'Failed to get link status' });
  }
});

// Link another user's account
router.post('/api/account/link', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const link = await createAccountLink(userId, email);
    
    res.json({ success: true, link });
  } catch (error: any) {
    console.error('Error creating account link:', error);
    res.status(400).json({ message: error.message || 'Failed to link account' });
  }
});

// Unlink an account (simple removal)
router.delete('/api/account/link/:secondaryUserId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { secondaryUserId } = req.params;

    await removeAccountLink(userId, secondaryUserId);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error removing account link:', error);
    res.status(400).json({ message: error.message || 'Failed to unlink account' });
  }
});

// Split accounts (copy all data to secondary user before unlinking)
router.post('/api/account/split/:secondaryUserId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const primaryUserId = getUserId(req);
    const { secondaryUserId } = req.params;
    const { splitDate } = req.body; // Optional: date from which to copy future data

    // 1. Copy all recipes
    const recipes = await storage.getRecipes(primaryUserId);
    for (const recipe of recipes) {
      await storage.createRecipe({
        userId: secondaryUserId,
        name: recipe.name,
        url: recipe.url || null,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : JSON.parse(recipe.ingredients || '[]'),
        instructions: recipe.instructions,
        isFavorite: recipe.isFavorite,
      });
    }

    // 2. Copy future meals (if splitDate provided)
    if (splitDate) {
      const meals = await storage.getMeals(primaryUserId);
      const futureMeals = meals.filter(m => m.weekStart && m.weekStart >= splitDate);
      
      for (const meal of futureMeals) {
        await storage.createMeal({
          userId: secondaryUserId,
          day: meal.day,
          type: meal.type,
          name: meal.name,
          notes: meal.notes || null,
          recipeId: meal.recipeId || null,
          weekStart: meal.weekStart || null,
        });
      }
    }

    // 3. Copy grocery items
    const groceryItems = await storage.getGroceryItems(primaryUserId);
    for (const item of groceryItems) {
      await storage.createGroceryItem({
        userId: secondaryUserId,
        name: item.name,
        normalizedName: item.normalizedName || null,
        quantity: item.quantity || 1,
        unit: item.unit || null,
        category: item.category || 'other',
        isBought: false, // Reset bought status
        isCustom: item.isCustom,
        sourceMeal: item.sourceMeal || null,
      });
    }

    // 4. Copy user settings
    const settings = await storage.getUserSettings(primaryUserId);
    if (settings) {
      // Parse work_days and breakfast_days if they're strings (from DB)
      const workDays = typeof settings.workDays === 'string' 
        ? JSON.parse(settings.workDays) 
        : settings.workDays;
      const breakfastDays = typeof settings.breakfastDays === 'string'
        ? JSON.parse(settings.breakfastDays)
        : settings.breakfastDays;
      
      await storage.upsertUserSettings({
        userId: secondaryUserId,
        workDays,
        workShift: settings.workShift,
        breakfastDays,
      });
    }

    // 5. Remove the link
    await removeAccountLink(primaryUserId, secondaryUserId);
    
    res.json({ 
      success: true, 
      message: 'Accounts split successfully. All data has been copied.',
    });
  } catch (error: any) {
    console.error('Error splitting accounts:', error);
    res.status(500).json({ message: error.message || 'Failed to split accounts' });
  }
});

// ========================================
// Enhanced Grocery Endpoints
// ========================================

// Update grocery item (edit quantity, unit, name)
router.put('/api/grocery/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const effectiveUserId = await getEffectiveUserId(req);
    const { id } = req.params;
    const { name, quantity, unit, category } = req.body;

    console.log(`[PUT /api/grocery/${id}] effectiveUserId: ${effectiveUserId}, looking for id: ${id}`);

    // Validate ownership
    const items = await storage.getGroceryItems(effectiveUserId);
    console.log(`[PUT /api/grocery/${id}] Found ${items.length} items for user`);
    
    const existing = items.find(i => i.id === parseInt(id));
    console.log(`[PUT /api/grocery/${id}] Found existing item:`, existing ? 'YES' : 'NO');
    
    if (!existing) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Simple direct update without re-parsing
    const updateData: any = {};
    
    if (name !== undefined && name !== null) {
      updateData.name = name;
    }
    
    if (quantity !== undefined && quantity !== null) {
      updateData.quantity = parseFloat(String(quantity)) || 1;
    }
    
    if (unit !== undefined) {
      updateData.unit = unit === "" || unit === "none" ? null : unit;
    }
    
    if (category !== undefined && category !== null) {
      updateData.category = category;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    const updated = await storage.updateGroceryItem(effectiveUserId, parseInt(id), updateData);
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating grocery item:', error);
    res.status(500).json({ message: 'Failed to update item' });
  }
});

// Delete all grocery items from a specific source meal
router.delete('/api/grocery/by-source/:sourceMeal', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const effectiveUserId = await getEffectiveUserId(req);
    const { sourceMeal } = req.params;

    // BETTER SOLUTION: Regenerate grocery list WITHOUT this recipe
    // Get all meals and recipes
    const allMeals = await storage.getMeals(effectiveUserId);
    const recipes = await storage.getRecipes(effectiveUserId);
    
    // Collect all ingredients from meals EXCEPT the specified recipe
    const allIngredients: { ingredient: string; sourceMeal: string }[] = [];
    
    for (const meal of allMeals) {
      if (meal.recipeId) {
        const recipe = recipes.find(r => r.id === meal.recipeId);
        if (recipe && recipe.ingredients) {
          // Skip if this is the recipe we want to remove
          if (recipe.name.toLowerCase() !== sourceMeal.toLowerCase()) {
            for (const ingredient of recipe.ingredients) {
              allIngredients.push({ ingredient, sourceMeal: recipe.name });
            }
          }
        }
      }
    }
    
    // Parse all ingredients
    const parsedIngredients = allIngredients.map(item => ({
      ...parseIngredient(item.ingredient),
      sourceMeal: item.sourceMeal,
    }));
    
    // Aggregate similar ingredients
    const aggregated = aggregateIngredients(parsedIngredients);
    
    // Clear existing grocery list
    await storage.deleteAllGroceryItems(effectiveUserId);
    
    // Add regenerated items
    for (const ing of aggregated) {
      // Get category for this ingredient
      const category = categorizeIngredient(ing.normalizedName);
      
      // Format the display name with quantity and unit
      const displayName = formatIngredient(ing);
      
      await storage.createGroceryItem({
        userId: effectiveUserId,
        name: displayName,
        normalizedName: ing.normalizedName,
        quantity: ing.quantity,
        unit: ing.unit || null,
        category: category,
        isBought: false,
        isCustom: false,
        sourceMeal: (ing as any).sourceMeal || null,
      });
    }
    
    res.json({ 
      success: true, 
      message: `Regenerated grocery list without ${sourceMeal}`,
      itemsGenerated: aggregated.length,
    });
  } catch (error) {
    console.error('Error deleting items by source:', error);
    res.status(500).json({ message: 'Failed to delete items' });
  }
});

// Get grocery items grouped by source meal
router.get('/api/grocery/by-source', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const effectiveUserId = await getEffectiveUserId(req);
    const items = await storage.getGroceryItems(effectiveUserId);
    
    // Group by sourceMeal
    const grouped = items.reduce((acc, item) => {
      const source = item.sourceMeal || 'Manual';
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(item);
      return acc;
    }, {} as Record<string, typeof items>);
    
    res.json(grouped);
  } catch (error) {
    console.error('Error getting items by source:', error);
    res.status(500).json({ message: 'Failed to get items' });
  }
});

export default router;
