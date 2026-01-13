import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface Recipe {
  id: string;
  name: string;
  url?: string;
  ingredients: string[];
  instructions: string;
  isFavorite: boolean;
  usageCount: number;
}

export interface Meal {
  id: string;
  day: string; // "Monday", etc.
  type: 'lunch' | 'dinner';
  name: string;
  notes?: string;
  recipeId?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  amount?: number;
  unit?: string;
  note?: string;
  isBought: boolean;
  isCustom: boolean;
  sourceMeal?: string;
}

interface StoreContextType {
  recipes: Recipe[];
  meals: Meal[];
  groceryItems: GroceryItem[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'usageCount' | 'isFavorite'>) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  updateMeal: (id: string, updates: Partial<Meal>) => void;
  deleteMeal: (id: string) => void;
  moveMeal: (id: string, newDay: string, newType: 'lunch' | 'dinner') => void;
  addGroceryItem: (name: string) => void;
  addIngredientsToGrocery: (ingredients: string[], sourceMeal?: string) => void;
  toggleGroceryItem: (id: string) => void;
  deleteGroceryItem: (id: string) => void;
  clearBoughtItems: () => void;
  clearAllItems: () => void;
  deleteItemsByMeal: (mealName: string) => void;
  getSourceMeals: () => string[];
  regenerateGroceryList: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Initial Data for Seeding
const SEED_RECIPES: Recipe[] = [
  {
    id: uuidv4(),
    name: "Köttbullar med potatismos",
    ingredients: ["Köttfärs 500g", "Ströbröd", "Lök", "Potatis 1kg", "Lingonsylt", "Gräddsås"],
    instructions: "Blanda färs och ströbröd. Rulla bullar. Stek. Koka potatis och mosa.",
    isFavorite: true,
    usageCount: 5,
  },
  {
    id: uuidv4(),
    name: "Pannkakor",
    ingredients: ["Mjöl 3dl", "Mjölk 6dl", "Ägg 3st", "Smör", "Sylt"],
    instructions: "Vispa ihop smeten. Stek tunna pannkakor i smör.",
    isFavorite: true,
    usageCount: 12,
  },
  {
    id: uuidv4(),
    name: "Linssoppa",
    ingredients: ["Röda linser", "Lök", "Morot", "Grönsaksbuljong", "Krossade tomater"],
    instructions: "Fräs lök och morot. Häll på linser, tomater och buljong. Koka 15 min.",
    isFavorite: false,
    usageCount: 2,
  },
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // State Initialization
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('app-recipes');
    return saved ? JSON.parse(saved) : SEED_RECIPES;
  });

  const [meals, setMeals] = useState<Meal[]>(() => {
    const saved = localStorage.getItem('app-meals');
    return saved ? JSON.parse(saved) : [];
  });

  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem('app-grocery');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence Effects
  useEffect(() => { localStorage.setItem('app-recipes', JSON.stringify(recipes)); }, [recipes]);
  useEffect(() => { localStorage.setItem('app-meals', JSON.stringify(meals)); }, [meals]);
  useEffect(() => { localStorage.setItem('app-grocery', JSON.stringify(groceryItems)); }, [groceryItems]);

  // Actions
  const addRecipe = (data: Omit<Recipe, 'id' | 'usageCount' | 'isFavorite'>) => {
    const newRecipe: Recipe = {
      ...data,
      id: uuidv4(),
      usageCount: 0,
      isFavorite: false,
    };
    setRecipes(prev => [...prev, newRecipe]);
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    // Also remove reference from meals
    setMeals(prev => prev.map(m => m.recipeId === id ? { ...m, recipeId: undefined } : m));
  };

  const toggleFavorite = (id: string) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
  };

  const addMeal = (data: Omit<Meal, 'id'>) => {
    const newMeal: Meal = { ...data, id: uuidv4() };
    setMeals(prev => [...prev, newMeal]);
    
    // If it's a recipe, increment usage
    if (data.recipeId) {
      setRecipes(prev => prev.map(r => r.id === data.recipeId ? { ...r, usageCount: r.usageCount + 1 } : r));
    }
  };

  const updateMeal = (id: string, updates: Partial<Meal>) => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMeal = (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const moveMeal = (id: string, newDay: string, newType: 'lunch' | 'dinner') => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, day: newDay, type: newType } : m));
  };

  // Grocery Logic
  const addGroceryItem = (name: string) => {
    setGroceryItems(prev => [
      ...prev,
      { id: uuidv4(), name, isBought: false, isCustom: true }
    ]);
  };

  const toggleGroceryItem = (id: string) => {
    setGroceryItems(prev => prev.map(i => i.id === id ? { ...i, isBought: !i.isBought } : i));
  };

  const deleteGroceryItem = (id: string) => {
    setGroceryItems(prev => prev.filter(i => i.id !== id));
  };

  // Common pantry items to ignore (always have at home)
  const PANTRY_STAPLES = [
    'salt', 'pepper', 'vatten', 'water', 'peppar',
    'svartpeppar', 'vitpeppar', 'black pepper', 'white pepper',
    'olivolja', 'olive oil', 'olja', 'oil',
    'is', 'ice', 'socker', 'sugar'
  ];

  const isPantryStaple = (ingredientName: string): boolean => {
    // Normalize: lowercase, remove punctuation, split into tokens
    const normalized = ingredientName
      .toLowerCase()
      .replace(/[(),.:;!?]/g, ' ')  // Replace punctuation with spaces
      .replace(/\s+/g, ' ')          // Collapse multiple spaces
      .trim();
    
    // Split into tokens and check if any token matches a pantry staple
    const tokens = normalized.split(' ');
    
    return PANTRY_STAPLES.some(staple => {
      // Check if staple appears as a standalone token
      if (tokens.includes(staple)) return true;
      
      // Check if any token starts with the staple (handles "saltet", "peppar,")
      if (tokens.some(token => token === staple || token.startsWith(staple))) return true;
      
      // Check if the full normalized string contains the staple as a word
      const regex = new RegExp(`\\b${staple}\\b`, 'i');
      return regex.test(normalized);
    });
  };

  const addIngredientsToGrocery = (ingredients: string[]) => {
    setGroceryItems(prev => {
      let newList = [...prev];
      
      // Filter out pantry staples
      const filteredIngredients = ingredients.filter(ing => !isPantryStaple(ing));
      
      filteredIngredients.forEach(rawIng => {
        // Parse ingredient: "Milk 1 L" -> { name: "milk", amount: 1, unit: "L" }
        // We need to handle Swedish ingredients better too
        // "Mjöl 3dl" -> parts: ["Mjöl", "3dl"]
        const trimmedIng = rawIng.trim();
        let name = "";
        let amount: number | undefined;
        let unit: string | undefined;

        // Try to find a number in the string
        const match = trimmedIng.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(.*)$/) || trimmedIng.match(/^(.+?)(\d+(?:\.\d+)?)\s*(.*)$/);
        
        if (match) {
          name = match[1].trim().toLowerCase();
          amount = parseFloat(match[2]);
          unit = match[3].trim().toLowerCase();
        } else {
          name = trimmedIng.toLowerCase();
        }

        // Normalization: remove plural 'er' or 'ar' and 's' at the end for basic matching
        const normalize = (s: string) => s.replace(/(er|ar|s)$/, '').trim();
        const normalizedName = normalize(name);

        const existingIndex = newList.findIndex(item => {
          if (item.isBought) return false;
          const itemNameMatch = item.name.toLowerCase().match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(.*)$/) || item.name.toLowerCase().match(/^(.+?)(\d+(?:\.\d+)?)\s*(.*)$/);
          const existingBaseName = itemNameMatch ? itemNameMatch[1].trim() : item.name.toLowerCase();
          return normalize(existingBaseName) === normalizedName;
        });

        if (existingIndex > -1) {
          const existing = newList[existingIndex];
          // If both have amounts and same unit, merge
          if (amount && existing.amount && (existing.unit || "") === (unit || "")) {
            const newAmount = existing.amount + amount;
            const newUnit = unit || existing.unit || "";
            newList[existingIndex] = {
              ...existing,
              amount: newAmount,
              name: `${name.charAt(0).toUpperCase() + name.slice(1)} ${newAmount}${newUnit ? " " + newUnit : ""}`
            };
          } else if (!amount && !existing.amount) {
            // Both are just names, already matched
          } else {
            // Conflict in units or missing amounts, just add a note
            newList[existingIndex] = {
              ...existing,
              note: existing.note ? `${existing.note}, check quantity` : "check quantity"
            };
          }
        } else {
          newList.push({
            id: uuidv4(),
            name: rawIng,
            amount,
            unit,
            isBought: false,
            isCustom: false
          });
        }
      });

      return newList;
    });
  };

  const clearBoughtItems = () => {
    setGroceryItems(prev => prev.filter(i => !i.isBought));
  };

  const clearAllItems = () => {
    setGroceryItems([]);
  };

  const deleteItemsByMeal = (mealName: string) => {
    setGroceryItems(prev => prev.filter(i => i.sourceMeal !== mealName));
  };

  const getSourceMeals = (): string[] => {
    const mealsSet = new Set<string>();
    groceryItems
      .filter(i => i.sourceMeal && !i.isBought)
      .forEach(i => mealsSet.add(i.sourceMeal as string));
    return Array.from(mealsSet);
  };

  const regenerateGroceryList = () => {
    // 1. Keep custom items that are NOT bought (optional logic, but let's keep all custom)
    const currentCustom = groceryItems.filter(i => i.isCustom);
    
    // 2. Generate items from meals in the current plan
    const newItems: GroceryItem[] = [];
    
    meals.forEach(meal => {
      if (meal.recipeId) {
        const recipe = recipes.find(r => r.id === meal.recipeId);
        if (recipe) {
          recipe.ingredients.forEach(ing => {
            // Skip pantry staples
            if (isPantryStaple(ing)) return;
            
            // Very simple duplicate check
            const exists = newItems.find(ni => ni.name === ing) || currentCustom.find(ci => ci.name === ing);
            if (!exists) {
              newItems.push({
                id: uuidv4(),
                name: ing,
                isBought: false,
                isCustom: false,
                sourceMeal: meal.name
              });
            }
          });
        }
      }
    });

    setGroceryItems([...currentCustom, ...newItems]);
  };

  return (
    <StoreContext.Provider value={{
      recipes, meals, groceryItems,
      addRecipe, updateRecipe, deleteRecipe, toggleFavorite,
      addMeal, updateMeal, deleteMeal, moveMeal,
      addGroceryItem, addIngredientsToGrocery, toggleGroceryItem, deleteGroceryItem, 
      clearBoughtItems, clearAllItems, deleteItemsByMeal, getSourceMeals, regenerateGroceryList
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
