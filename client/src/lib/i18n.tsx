import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'sv' | 'en';

type Translations = {
  [key in Language]: {
    // Nav
    home: string;
    weeklyPlan: string;
    recipes: string;
    groceryList: string;
    favorites: string;
    
    // General
    add: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    move: string;
    search: string;
    language: string;
    
    // Headings
    goodMorning: string;
    goodAfternoon: string;
    goodEvening: string;
    todaysMeals: string;
    stats: string;
    totalRecipes: string;
    itemsToBuy: string;
    
    // Weekly Plan
    lunch: string;
    dinner: string;
    addMeal: string;
    moveTo: string;
    copyTo: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
    
    // Recipes
    recipeName: string;
    recipeUrl: string;
    ingredients: string;
    instructions: string;
    noRecipes: string;
    addToPlan: string;
    createRecipe: string;
    searchPlaceholder: string;
    
    // Grocery
    addItem: string;
    clearBought: string;
    bought: string;
    customItem: string;
    noItems: string;
    generatedFromPlan: string;
    addIngredientsToGrocery: string;
    yesAdd: string;
    no: string;
    plannedDays: string;
  };
};

const translations: Translations = {
  sv: {
    home: "Hem",
    weeklyPlan: "Veckoplan",
    recipes: "Recept",
    groceryList: "Inköpslista",
    favorites: "Favoriter",
    add: "Lägg till",
    edit: "Redigera",
    delete: "Ta bort",
    save: "Spara",
    cancel: "Avbryt",
    move: "Flytta",
    search: "Sök",
    language: "Språk",
    goodMorning: "God morgon",
    goodAfternoon: "God dag",
    goodEvening: "God kväll",
    todaysMeals: "Dagens måltider",
    stats: "Statistik",
    totalRecipes: "sparade recept",
    itemsToBuy: "varor att köpa",
    lunch: "Lunch",
    dinner: "Middag",
    addMeal: "Lägg till måltid",
    moveTo: "Flytta till...",
    copyTo: "Kopiera till...",
    monday: "Måndag",
    tuesday: "Tisdag",
    wednesday: "Onsdag",
    thursday: "Torsdag",
    friday: "Fredag",
    saturday: "Lördag",
    sunday: "Söndag",
    recipeName: "Receptnamn",
    recipeUrl: "Webblänk (valfritt)",
    ingredients: "Ingredienser (en per rad)",
    instructions: "Instruktioner",
    noRecipes: "Inga recept än. Skapa ett!",
    addToPlan: "Lägg till i veckoplan",
    createRecipe: "Nytt Recept",
    searchPlaceholder: "Sök recept...",
    addItem: "Lägg till vara",
    clearBought: "Rensa köpta",
    bought: "Köpt",
    customItem: "Egen vara",
    noItems: "Listan är tom!",
    generatedFromPlan: "Från matplan",
    addIngredientsToGrocery: "Vill du lägga till ingredienserna i inköpslistan?",
    yesAdd: "Ja, lägg till",
    no: "Nej",
    plannedDays: "dagar planerade",
  },
  en: {
    home: "Home",
    weeklyPlan: "Weekly Plan",
    recipes: "Recipes",
    groceryList: "Grocery List",
    favorites: "Favorites",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    move: "Move",
    search: "Search",
    language: "Language",
    goodMorning: "Good Morning",
    goodAfternoon: "Good Afternoon",
    goodEvening: "Good Evening",
    todaysMeals: "Today's Meals",
    stats: "Overview",
    totalRecipes: "saved recipes",
    itemsToBuy: "items to buy",
    lunch: "Lunch",
    dinner: "Dinner",
    addMeal: "Add Meal",
    moveTo: "Move to...",
    copyTo: "Copy to...",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    recipeName: "Recipe Name",
    recipeUrl: "Recipe URL (optional)",
    ingredients: "Ingredients (one per line)",
    instructions: "Instructions",
    noRecipes: "No recipes yet. Create one!",
    addToPlan: "Add to Weekly Plan",
    createRecipe: "New Recipe",
    searchPlaceholder: "Search recipes...",
    addItem: "Add Item",
    clearBought: "Clear Bought",
    bought: "Bought",
    customItem: "Custom Item",
    noItems: "List is empty!",
    generatedFromPlan: "From Meal Plan",
    addIngredientsToGrocery: "Do you want to add the ingredients to the grocery list?",
    yesAdd: "Yes, add",
    no: "No",
    plannedDays: "days planned",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app-language') as Language) || 'sv';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const t = (key: keyof Translations['en']) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
