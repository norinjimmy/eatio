import React, { createContext, useContext } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from './queryClient';
import type { Recipe, Meal, GroceryItem, UserSettings } from '@shared/schema';
import { parseIngredient, isPantryStaple, aggregateIngredients, formatIngredient } from '@shared/ingredient-utils';

interface StoreContextType {
  recipes: Recipe[];
  meals: Meal[];
  groceryItems: GroceryItem[];
  settings: UserSettings | null;
  isLoading: boolean;
  addRecipe: (recipe: { name: string; url?: string; ingredients: string[]; instructions: string; isFavorite?: boolean }) => Promise<void>;
  updateRecipe: (id: number, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  addMeal: (meal: { day: string; type: string; name: string; notes?: string; recipeId?: number; weekStart?: string }) => Promise<void>;
  updateMeal: (id: number, updates: Partial<Meal>) => Promise<void>;
  deleteMeal: (id: number) => Promise<void>;
  moveMeal: (id: number, newDay: string, newType: string) => Promise<void>;
  addGroceryItem: (name: string, isCustom?: boolean, sourceMeal?: string, quantity?: number, unit?: string) => Promise<void>;
  addIngredientsToGrocery: (ingredients: string[], sourceMeal?: string) => Promise<void>;
  toggleGroceryItem: (id: number) => Promise<void>;
  deleteGroceryItem: (id: number) => Promise<void>;
  clearBoughtItems: () => Promise<void>;
  clearAllItems: () => Promise<void>;
  deleteItemsByMeal: (mealName: string) => Promise<void>;
  getSourceMeals: () => string[];
  regenerateGroceryList: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const recipesQuery = useQuery<Recipe[]>({ queryKey: ['/api/recipes'] });
  const mealsQuery = useQuery<Meal[]>({ queryKey: ['/api/meals'] });
  const groceryQuery = useQuery<GroceryItem[]>({ queryKey: ['/api/grocery'] });
  const settingsQuery = useQuery<UserSettings>({ queryKey: ['/api/settings'] });

  const recipes = recipesQuery.data ?? [];
  const meals = mealsQuery.data ?? [];
  const groceryItems = groceryQuery.data ?? [];
  const settings = settingsQuery.data ?? null;
  const isLoading = recipesQuery.isLoading || mealsQuery.isLoading || groceryQuery.isLoading;

  const createRecipeMutation = useMutation({
    mutationFn: (data: { name: string; url?: string; ingredients: string[]; instructions: string; isFavorite?: boolean }) =>
      apiRequest('POST', '/api/recipes', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/recipes'] }),
  });

  const updateRecipeMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Recipe> }) =>
      apiRequest('PATCH', `/api/recipes/${id}`, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/recipes'] }),
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/recipes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/recipes'] }),
  });

  const createMealMutation = useMutation({
    mutationFn: (data: { day: string; type: string; name: string; notes?: string; recipeId?: number; weekStart?: string }) =>
      apiRequest('POST', '/api/meals', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/meals'] }),
  });

  const updateMealMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Meal> }) =>
      apiRequest('PATCH', `/api/meals/${id}`, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/meals'] });
      const previousMeals = queryClient.getQueryData<Meal[]>(['/api/meals']);
      if (previousMeals) {
        queryClient.setQueryData<Meal[]>(['/api/meals'], 
          previousMeals.map(meal => meal.id === id ? { ...meal, ...updates } : meal)
        );
      }
      return { previousMeals };
    },
    onError: (_, __, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData(['/api/meals'], context.previousMeals);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['/api/meals'] }),
  });

  const deleteMealMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/meals/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['/api/meals'] });
      const previousMeals = queryClient.getQueryData<Meal[]>(['/api/meals']);
      if (previousMeals) {
        queryClient.setQueryData<Meal[]>(['/api/meals'], previousMeals.filter(m => m.id !== id));
      }
      return { previousMeals };
    },
    onError: (_, __, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData(['/api/meals'], context.previousMeals);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['/api/meals'] }),
  });

  const createGroceryMutation = useMutation({
    mutationFn: (data: { name: string; isCustom?: boolean; sourceMeal?: string; quantity?: number; unit?: string | null; normalizedName?: string }) =>
      apiRequest('POST', '/api/grocery', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/grocery'] }),
  });

  const updateGroceryMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<GroceryItem> }) =>
      apiRequest('PATCH', `/api/grocery/${id}`, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/grocery'] });
      const previousItems = queryClient.getQueryData<GroceryItem[]>(['/api/grocery']);
      if (previousItems) {
        queryClient.setQueryData<GroceryItem[]>(['/api/grocery'], 
          previousItems.map(item => item.id === id ? { ...item, ...updates } : item)
        );
      }
      return { previousItems };
    },
    onError: (_, __, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['/api/grocery'], context.previousItems);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['/api/grocery'] }),
  });

  const deleteGroceryMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/grocery/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/grocery'] }),
  });

  const clearAllGroceryMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/grocery'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/grocery'] }),
  });

  const deleteByMealMutation = useMutation({
    mutationFn: (mealName: string) => apiRequest('DELETE', `/api/grocery/by-meal/${encodeURIComponent(mealName)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/grocery'] }),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<UserSettings>) =>
      apiRequest('PUT', '/api/settings', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/settings'] }),
  });

  const addRecipe = async (recipe: { name: string; url?: string; ingredients: string[]; instructions: string; isFavorite?: boolean }) => {
    await createRecipeMutation.mutateAsync(recipe);
  };

  const updateRecipe = async (id: number, updates: Partial<Recipe>) => {
    await updateRecipeMutation.mutateAsync({ id, updates });
  };

  const deleteRecipe = async (id: number) => {
    await deleteRecipeMutation.mutateAsync(id);
  };

  const toggleFavorite = async (id: number) => {
    const recipe = recipes.find(r => r.id === id);
    if (recipe) {
      await updateRecipe(id, { isFavorite: !recipe.isFavorite });
    }
  };

  const addMeal = async (meal: { day: string; type: string; name: string; notes?: string; recipeId?: number; weekStart?: string }) => {
    await createMealMutation.mutateAsync(meal);
    if (meal.recipeId) {
      const recipe = recipes.find(r => r.id === meal.recipeId);
      if (recipe) {
        await updateRecipe(meal.recipeId, { usageCount: recipe.usageCount + 1 });
      }
    }
  };

  const updateMeal = async (id: number, updates: Partial<Meal>) => {
    await updateMealMutation.mutateAsync({ id, updates });
  };

  const deleteMeal = async (id: number) => {
    await deleteMealMutation.mutateAsync(id);
  };

  const moveMeal = async (id: number, newDay: string, newType: string) => {
    await updateMeal(id, { day: newDay, type: newType });
  };

  const addGroceryItem = async (name: string, isCustom = true, sourceMeal?: string, quantity?: number, unit?: string, normalizedName?: string) => {
    await createGroceryMutation.mutateAsync({ name, isCustom, sourceMeal, quantity, unit, normalizedName });
  };

  const addIngredientsToGrocery = async (ingredients: string[], sourceMeal?: string) => {
    const filteredIngredients = ingredients.filter(ing => !isPantryStaple(ing));
    
    // Parse all ingredients
    const parsedIngredients = filteredIngredients.map(ing => parseIngredient(ing));
    
    // Aggregate duplicates within the new ingredients
    const aggregated = aggregateIngredients(parsedIngredients);
    
    for (const parsed of aggregated) {
      // Check if ingredient already exists (match by normalized name and unit)
      const existingItem = groceryItems.find(item => 
        !item.isBought && 
        item.normalizedName?.toLowerCase() === parsed.normalizedName.toLowerCase() &&
        (item.unit || null) === (parsed.unit || null)
      );
      
      if (existingItem) {
        // Update quantity by adding to existing
        const newQuantity = (existingItem.quantity || 1) + parsed.quantity;
        await updateGroceryMutation.mutateAsync({ 
          id: existingItem.id, 
          updates: { quantity: newQuantity } 
        });
      } else {
        // Add new item with parsed data
        const displayName = formatIngredient(parsed);
        await addGroceryItem(displayName, false, sourceMeal, parsed.quantity, parsed.unit || undefined, parsed.normalizedName);
      }
    }
  };

  const toggleGroceryItem = async (id: number) => {
    const item = groceryItems.find(i => i.id === id);
    if (item) {
      await updateGroceryMutation.mutateAsync({ id, updates: { isBought: !item.isBought } });
    }
  };

  const deleteGroceryItem = async (id: number) => {
    await deleteGroceryMutation.mutateAsync(id);
  };

  const clearBoughtItems = async () => {
    const boughtItems = groceryItems.filter(i => i.isBought);
    for (const item of boughtItems) {
      await deleteGroceryItem(item.id);
    }
  };

  const clearAllItems = async () => {
    await clearAllGroceryMutation.mutateAsync();
  };

  const deleteItemsByMeal = async (mealName: string) => {
    await deleteByMealMutation.mutateAsync(mealName);
  };

  const getSourceMeals = (): string[] => {
    const mealsSet = new Set<string>();
    groceryItems
      .filter(i => i.sourceMeal && !i.isBought)
      .forEach(i => mealsSet.add(i.sourceMeal as string));
    return Array.from(mealsSet);
  };

  const regenerateGroceryList = async () => {
    const currentCustom = groceryItems.filter(i => i.isCustom);
    await clearAllItems();
    
    // Re-add custom items
    for (const item of currentCustom) {
      await addGroceryItem(item.name, true, undefined, item.quantity || 1, item.unit || undefined, item.normalizedName || undefined);
    }
    
    // Collect all ingredients from all meals
    const allIngredients: { ingredient: string; sourceMeal: string }[] = [];
    for (const meal of meals) {
      if (meal.recipeId) {
        const recipe = recipes.find(r => r.id === meal.recipeId);
        if (recipe) {
          for (const ing of recipe.ingredients) {
            if (!isPantryStaple(ing)) {
              allIngredients.push({ ingredient: ing, sourceMeal: meal.name });
            }
          }
        }
      }
    }
    
    // Parse and aggregate all ingredients
    const parsedIngredients = allIngredients.map(({ ingredient }) => parseIngredient(ingredient));
    const aggregated = aggregateIngredients(parsedIngredients);
    
    // Add aggregated items
    for (const parsed of aggregated) {
      const displayName = formatIngredient(parsed);
      await addGroceryItem(displayName, false, undefined, parsed.quantity, parsed.unit || undefined, parsed.normalizedName);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    await updateSettingsMutation.mutateAsync({
      ...settings,
      ...newSettings,
    });
  };

  return (
    <StoreContext.Provider value={{
      recipes, meals, groceryItems, settings, isLoading,
      addRecipe, updateRecipe, deleteRecipe, toggleFavorite,
      addMeal, updateMeal, deleteMeal, moveMeal,
      addGroceryItem, addIngredientsToGrocery, toggleGroceryItem, deleteGroceryItem, 
      clearBoughtItems, clearAllItems, deleteItemsByMeal, getSourceMeals, regenerateGroceryList,
      updateSettings
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

export type { Recipe, Meal, GroceryItem, UserSettings };
