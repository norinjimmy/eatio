import { supabaseAdmin } from "./supabase";
import type { IStorage } from "./storage";
import type {
  Recipe, InsertRecipe, InsertRecipeWithUser,
  Meal, InsertMeal, InsertMealWithUser,
  GroceryItem, InsertGroceryItem, InsertGroceryItemWithUser,
  UserSettings, InsertUserSettings,
  MealPlanShare, InsertMealPlanShare,
  WeekHistory, InsertWeekHistory
} from "@shared/schema";

export class SupabaseStorage implements IStorage {
  // Recipes
  async getRecipes(userId: string): Promise<Recipe[]> {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return (data || []).map(r => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      url: r.url,
      ingredients: r.ingredients || [],
      instructions: r.instructions,
      isFavorite: r.is_favorite,
      usageCount: r.usage_count,
    }));
  }

  async getRecipe(userId: string, id: number): Promise<Recipe | undefined> {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      url: data.url,
      ingredients: data.ingredients || [],
      instructions: data.instructions,
      isFavorite: data.is_favorite,
      usageCount: data.usage_count,
    };
  }

  async createRecipe(insertRecipe: InsertRecipeWithUser): Promise<Recipe> {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .insert({
        user_id: insertRecipe.userId,
        name: insertRecipe.name,
        url: insertRecipe.url,
        ingredients: insertRecipe.ingredients || [],
        instructions: insertRecipe.instructions,
        is_favorite: insertRecipe.isFavorite || false,
        usage_count: 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      url: data.url,
      ingredients: data.ingredients || [],
      instructions: data.instructions,
      isFavorite: data.is_favorite,
      usageCount: data.usage_count,
    };
  }

  async updateRecipe(userId: string, id: number, updates: Partial<InsertRecipe>): Promise<Recipe> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.ingredients !== undefined) updateData.ingredients = updates.ingredients;
    if (updates.instructions !== undefined) updateData.instructions = updates.instructions;
    if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite;
    
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      url: data.url,
      ingredients: data.ingredients || [],
      instructions: data.instructions,
      isFavorite: data.is_favorite,
      usageCount: data.usage_count,
    };
  }

  async deleteRecipe(userId: string, id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  // Meals
  async getMeals(userId: string): Promise<Meal[]> {
    const { data, error } = await supabaseAdmin
      .from('meals')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return (data || []).map(m => ({
      id: m.id,
      userId: m.user_id,
      day: m.day,
      type: m.type,
      name: m.name,
      notes: m.notes,
      recipeId: m.recipe_id,
      weekStart: m.week_start,
    }));
  }

  async getMeal(userId: string, id: number): Promise<Meal | undefined> {
    const { data, error } = await supabaseAdmin
      .from('meals')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      day: data.day,
      type: data.type,
      name: data.name,
      notes: data.notes,
      recipeId: data.recipe_id,
      weekStart: data.week_start,
    };
  }

  async createMeal(insertMeal: InsertMealWithUser): Promise<Meal> {
    const { data, error } = await supabaseAdmin
      .from('meals')
      .insert({
        user_id: insertMeal.userId,
        day: insertMeal.day,
        type: insertMeal.type,
        name: insertMeal.name,
        notes: insertMeal.notes,
        recipe_id: insertMeal.recipeId,
        week_start: insertMeal.weekStart,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      day: data.day,
      type: data.type,
      name: data.name,
      notes: data.notes,
      recipeId: data.recipe_id,
      weekStart: data.week_start,
    };
  }

  async updateMeal(userId: string, id: number, updates: Partial<InsertMeal>): Promise<Meal> {
    const updateData: any = {};
    if (updates.day !== undefined) updateData.day = updates.day;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.recipeId !== undefined) updateData.recipe_id = updates.recipeId;
    if (updates.weekStart !== undefined) updateData.week_start = updates.weekStart;
    
    const { data, error } = await supabaseAdmin
      .from('meals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      day: data.day,
      type: data.type,
      name: data.name,
      notes: data.notes,
      recipeId: data.recipe_id,
      weekStart: data.week_start,
    };
  }

  async deleteMeal(userId: string, id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('meals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  async deleteAllMeals(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('meals')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  // Grocery
  async getGroceryItems(userId: string): Promise<GroceryItem[]> {
    console.log('[storage.getGroceryItems] Called with userId:', userId);
    const { data, error } = await supabaseAdmin
      .from('grocery_items')
      .select('*')
      .eq('user_id', userId);
    
    console.log('[storage.getGroceryItems] Returned:', data?.length || 0, 'items');
    if (error) {
      console.error('[storage.getGroceryItems] Error:', error);
      throw error;
    }
    
    return (data || []).map(g => ({
      id: g.id,
      userId: g.user_id,
      name: g.name,
      normalizedName: g.normalized_name,
      quantity: g.quantity,
      unit: g.unit,
      category: g.category,
      isBought: g.is_bought,
      isCustom: g.is_custom,
      sourceMeal: g.source_meal,
    }));
  }

  async getGroceryItem(userId: string, id: number): Promise<GroceryItem | undefined> {
    const { data, error } = await supabaseAdmin
      .from('grocery_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      normalizedName: data.normalized_name,
      quantity: data.quantity,
      unit: data.unit,
      category: data.category,
      isBought: data.is_bought,
      isCustom: data.is_custom,
      sourceMeal: data.source_meal,
    };
  }

  async createGroceryItem(insertItem: InsertGroceryItemWithUser): Promise<GroceryItem> {
    const { data, error } = await supabaseAdmin
      .from('grocery_items')
      .insert({
        user_id: insertItem.userId,
        name: insertItem.name,
        normalized_name: insertItem.normalizedName,
        quantity: insertItem.quantity,
        unit: insertItem.unit,
        category: insertItem.category,
        is_bought: insertItem.isBought || false,
        is_custom: insertItem.isCustom || false,
        source_meal: insertItem.sourceMeal,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      normalizedName: data.normalized_name,
      quantity: data.quantity,
      unit: data.unit,
      category: data.category,
      isBought: data.is_bought,
      isCustom: data.is_custom,
      sourceMeal: data.source_meal,
    };
  }

  async updateGroceryItem(userId: string, id: number, updates: Partial<InsertGroceryItem>): Promise<GroceryItem> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.normalizedName !== undefined) updateData.normalized_name = updates.normalizedName;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.isBought !== undefined) updateData.is_bought = updates.isBought;
    if (updates.isCustom !== undefined) updateData.is_custom = updates.isCustom;
    if (updates.sourceMeal !== undefined) updateData.source_meal = updates.sourceMeal;
    
    const { data, error } = await supabaseAdmin
      .from('grocery_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      normalizedName: data.normalized_name,
      quantity: data.quantity,
      unit: data.unit,
      category: data.category,
      isBought: data.is_bought,
      isCustom: data.is_custom,
      sourceMeal: data.source_meal,
    };
  }

  async deleteGroceryItem(userId: string, id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('grocery_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  async deleteAllGroceryItems(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('grocery_items')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  async deleteGroceryItemsByMeal(userId: string, mealName: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('grocery_items')
      .delete()
      .eq('user_id', userId)
      .eq('source_meal', mealName);
    
    if (error) throw error;
  }

  // Settings
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      workDays: data.work_days || [],
      workShift: data.work_shift,
      breakfastDays: data.breakfast_days || [],
    };
  }

  async upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .upsert({
        user_id: settings.userId,
        work_days: settings.workDays || [],
        work_shift: settings.workShift,
        breakfast_days: settings.breakfastDays || [],
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      workDays: data.work_days || [],
      workShift: data.work_shift,
      breakfastDays: data.breakfast_days || [],
    };
  }

  // Shares
  async createShare(share: InsertMealPlanShare): Promise<MealPlanShare> {
    const { data, error } = await supabaseAdmin
      .from('meal_plan_shares')
      .insert({
        owner_id: share.ownerId,
        owner_name: share.ownerName,
        invited_email: share.invitedEmail,
        invited_user_id: share.invitedUserId,
        permission: share.permission,
        status: share.status,
        share_token: share.shareToken,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      ownerId: data.owner_id,
      ownerName: data.owner_name,
      invitedEmail: data.invited_email,
      invitedUserId: data.invited_user_id,
      permission: data.permission,
      status: data.status,
      shareToken: data.share_token,
      createdAt: data.created_at,
    };
  }

  async getSharesByOwner(ownerId: string): Promise<MealPlanShare[]> {
    const { data, error } = await supabaseAdmin
      .from('meal_plan_shares')
      .select('*')
      .eq('owner_id', ownerId);
    
    if (error) throw error;
    
    return (data || []).map(s => ({
      id: s.id,
      ownerId: s.owner_id,
      ownerName: s.owner_name,
      invitedEmail: s.invited_email,
      invitedUserId: s.invited_user_id,
      permission: s.permission,
      status: s.status,
      shareToken: s.share_token,
      createdAt: s.created_at,
    }));
  }

  async getSharesForUser(userId: string, userEmail: string): Promise<MealPlanShare[]> {
    const { data, error } = await supabaseAdmin
      .from('meal_plan_shares')
      .select('*')
      .eq('status', 'accepted')
      .or(`invited_user_id.eq.${userId},invited_email.eq.${userEmail}`);
    
    if (error) throw error;
    
    return (data || []).map(s => ({
      id: s.id,
      ownerId: s.owner_id,
      ownerName: s.owner_name,
      invitedEmail: s.invited_email,
      invitedUserId: s.invited_user_id,
      permission: s.permission,
      status: s.status,
      shareToken: s.share_token,
      createdAt: s.created_at,
    }));
  }

  async getPendingSharesForUser(userEmail: string): Promise<MealPlanShare[]> {
    const { data, error } = await supabaseAdmin
      .from('meal_plan_shares')
      .select('*')
      .eq('status', 'pending')
      .eq('invited_email', userEmail);
    
    if (error) throw error;
    
    return (data || []).map(s => ({
      id: s.id,
      ownerId: s.owner_id,
      ownerName: s.owner_name,
      invitedEmail: s.invited_email,
      invitedUserId: s.invited_user_id,
      permission: s.permission,
      status: s.status,
      shareToken: s.share_token,
      createdAt: s.created_at,
    }));
  }

  async getShareByToken(token: string): Promise<MealPlanShare | undefined> {
    const { data, error } = await supabaseAdmin
      .from('meal_plan_shares')
      .select('*')
      .eq('share_token', token)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    
    return {
      id: data.id,
      ownerId: data.owner_id,
      ownerName: data.owner_name,
      invitedEmail: data.invited_email,
      invitedUserId: data.invited_user_id,
      permission: data.permission,
      status: data.status,
      shareToken: data.share_token,
      createdAt: data.created_at,
    };
  }

  async updateShare(id: number, updates: Partial<InsertMealPlanShare>): Promise<MealPlanShare> {
    const updateData: any = {};
    if (updates.ownerName !== undefined) updateData.owner_name = updates.ownerName;
    if (updates.invitedEmail !== undefined) updateData.invited_email = updates.invitedEmail;
    if (updates.invitedUserId !== undefined) updateData.invited_user_id = updates.invitedUserId;
    if (updates.permission !== undefined) updateData.permission = updates.permission;
    if (updates.status !== undefined) updateData.status = updates.status;
    
    const { data, error } = await supabaseAdmin
      .from('meal_plan_shares')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      ownerId: data.owner_id,
      ownerName: data.owner_name,
      invitedEmail: data.invited_email,
      invitedUserId: data.invited_user_id,
      permission: data.permission,
      status: data.status,
      shareToken: data.share_token,
      createdAt: data.created_at,
    };
  }

  async deleteShare(ownerId: string, id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('meal_plan_shares')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);
    
    if (error) throw error;
  }

  async acceptShare(token: string, userId: string): Promise<MealPlanShare | undefined> {
    const { data, error } = await supabaseAdmin
      .from('meal_plan_shares')
      .update({ status: 'accepted', invited_user_id: userId })
      .eq('share_token', token)
      .eq('status', 'pending')
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    
    return {
      id: data.id,
      ownerId: data.owner_id,
      ownerName: data.owner_name,
      invitedEmail: data.invited_email,
      invitedUserId: data.invited_user_id,
      permission: data.permission,
      status: data.status,
      shareToken: data.share_token,
      createdAt: data.created_at,
    };
  }

  async acceptShareById(id: number, userId: string): Promise<MealPlanShare | undefined> {
    const { data, error } = await supabaseAdmin
      .from('meal_plan_shares')
      .update({ status: 'accepted', invited_user_id: userId })
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    
    return {
      id: data.id,
      ownerId: data.owner_id,
      ownerName: data.owner_name,
      invitedEmail: data.invited_email,
      invitedUserId: data.invited_user_id,
      permission: data.permission,
      status: data.status,
      shareToken: data.share_token,
      createdAt: data.created_at,
    };
  }

  async declineShare(id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('meal_plan_shares')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Week History
  async getWeekHistory(userId: string): Promise<WeekHistory[]> {
    const { data, error } = await supabaseAdmin
      .from('week_history')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(h => ({
      id: h.id,
      userId: h.user_id,
      weekStart: h.week_start,
      meals: h.meals || [],
      createdAt: h.created_at,
    }));
  }

  async getWeekHistoryByWeek(userId: string, weekStart: string): Promise<WeekHistory | undefined> {
    const { data, error } = await supabaseAdmin
      .from('week_history')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      weekStart: data.week_start,
      meals: data.meals || [],
      createdAt: data.created_at,
    };
  }

  async archiveWeek(userId: string, weekStart: string, mealsData: Meal[]): Promise<WeekHistory> {
    const existing = await this.getWeekHistoryByWeek(userId, weekStart);
    
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('week_history')
        .update({ meals: mealsData })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        userId: data.user_id,
        weekStart: data.week_start,
        meals: data.meals || [],
        createdAt: data.created_at,
      };
    }
    
    const { data, error } = await supabaseAdmin
      .from('week_history')
      .insert({
        user_id: userId,
        week_start: weekStart,
        meals: mealsData,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      weekStart: data.week_start,
      meals: data.meals || [],
      createdAt: data.created_at,
    };
  }

  // Account
  async deleteUserData(userId: string): Promise<void> {
    // Delete in correct order to respect foreign key constraints
    await supabaseAdmin.from('grocery_items').delete().eq('user_id', userId);
    await supabaseAdmin.from('meals').delete().eq('user_id', userId);
    await supabaseAdmin.from('recipes').delete().eq('user_id', userId);
    await supabaseAdmin.from('user_settings').delete().eq('user_id', userId);
    await supabaseAdmin.from('week_history').delete().eq('user_id', userId);
    
    // Delete shares where user is owner or invited
    await supabaseAdmin.from('meal_plan_shares').delete().or(`owner_id.eq.${userId},invited_user_id.eq.${userId}`);
  }
}

export const storage = new SupabaseStorage();
