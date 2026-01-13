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
    fetch: string;
    enterUrl: string;
    fetchSuccess: string;
    ingredientsFound: string;
    fetchFailed: string;
    couldNotFetchRecipe: string;
    
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
    settings: string;
    workDays: string;
    workDaysDesc: string;
    workShift: string;
    workShiftDesc: string;
    dayShift: string;
    eveningShift: string;
    breakfastDays: string;
    breakfastDaysDesc: string;
    breakfast: string;
    scanRecipe: string;
    takePhoto: string;
    uploadPhoto: string;
    scanning: string;
    scanSuccess: string;
    scanFailed: string;
    couldNotScanRecipe: string;
    clearAll: string;
    clearByMeal: string;
    confirmClearAll: string;
    itemsCleared: string;
    removeIngredientsFromGrocery: string;
    yesRemove: string;
    login: string;
    logout: string;
    welcomeMessage: string;
    loginHint: string;
    planMealsDesc: string;
    manageRecipesDesc: string;
    groceryListDesc: string;
    sharing: string;
    sharingDesc: string;
    inviteFamily: string;
    enterEmail: string;
    sendInvite: string;
    pendingInvites: string;
    acceptedShares: string;
    sharedWithMe: string;
    viewPlan: string;
    permission: string;
    viewOnly: string;
    canEdit: string;
    revoke: string;
    inviteSent: string;
    noShares: string;
    noSharedWithMe: string;
    acceptInvite: string;
    viewingPlanOf: string;
    backToMyPlan: string;
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
    fetch: "Hämta",
    enterUrl: "Ange en URL först",
    fetchSuccess: "Recept hämtat",
    ingredientsFound: "ingredienser hittade",
    fetchFailed: "Kunde inte hämta",
    couldNotFetchRecipe: "Kunde inte läsa receptet från länken",
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
    settings: "Inställningar",
    workDays: "Arbetsdagar",
    workDaysDesc: "Välj dagar du jobbar och vill hoppa över en måltid.",
    workShift: "Arbetspass",
    workShiftDesc: "Välj om du jobbar dag eller kväll för att dölja rätt måltid på arbetsdagar.",
    dayShift: "Dagtid (hoppa över lunch)",
    eveningShift: "Kvällstid (hoppa över middag)",
    breakfastDays: "Frukostdagar",
    breakfastDaysDesc: "Välj vilka dagar du vill planera frukost.",
    breakfast: "Frukost",
    scanRecipe: "Skanna recept",
    takePhoto: "Ta foto",
    uploadPhoto: "Ladda upp foto",
    scanning: "Analyserar...",
    scanSuccess: "Recept skannat",
    scanFailed: "Kunde inte skanna",
    couldNotScanRecipe: "Kunde inte läsa receptet från bilden",
    clearAll: "Radera allt",
    clearByMeal: "Radera per måltid",
    confirmClearAll: "Är du säker på att du vill radera hela inköpslistan?",
    itemsCleared: "Varor raderade",
    removeIngredientsFromGrocery: "Vill du även ta bort ingredienserna från inköpslistan?",
    yesRemove: "Ja, ta bort",
    login: "Logga in",
    logout: "Logga ut",
    welcomeMessage: "Din assistent för familjens matplanering",
    loginHint: "Logga in med Google, GitHub, Apple eller e-post",
    planMealsDesc: "Planera familjens måltider för hela veckan",
    manageRecipesDesc: "Spara och organisera dina favoritrecept",
    groceryListDesc: "Skapa inköpslistor från din matplan",
    sharing: "Delning",
    sharingDesc: "Bjud in familjemedlemmar att se din veckoplan",
    inviteFamily: "Bjud in familjemedlem",
    enterEmail: "E-postadress",
    sendInvite: "Skicka inbjudan",
    pendingInvites: "Väntande inbjudningar",
    acceptedShares: "Aktiva delningar",
    sharedWithMe: "Delat med mig",
    viewPlan: "Visa plan",
    permission: "Behörighet",
    viewOnly: "Kan visa",
    canEdit: "Kan redigera",
    revoke: "Ta bort",
    inviteSent: "Inbjudan skickad",
    noShares: "Inga delningar ännu",
    noSharedWithMe: "Ingen har delat sin plan med dig ännu",
    acceptInvite: "Acceptera inbjudan",
    viewingPlanOf: "Visar plan för",
    backToMyPlan: "Tillbaka till min plan",
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
    fetch: "Fetch",
    enterUrl: "Enter a URL first",
    fetchSuccess: "Recipe fetched",
    ingredientsFound: "ingredients found",
    fetchFailed: "Could not fetch",
    couldNotFetchRecipe: "Could not read recipe from the link",
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
    settings: "Settings",
    workDays: "Work Days",
    workDaysDesc: "Select days you work and want to skip a meal.",
    workShift: "Work shift",
    workShiftDesc: "Choose if you work day or evening shift to hide the right meal on work days.",
    dayShift: "Day shift (skip lunch)",
    eveningShift: "Evening shift (skip dinner)",
    breakfastDays: "Breakfast days",
    breakfastDaysDesc: "Choose which days you want to plan breakfast.",
    breakfast: "Breakfast",
    scanRecipe: "Scan recipe",
    takePhoto: "Take photo",
    uploadPhoto: "Upload photo",
    scanning: "Scanning...",
    scanSuccess: "Recipe scanned",
    scanFailed: "Could not scan",
    couldNotScanRecipe: "Could not read recipe from the image",
    clearAll: "Clear all",
    clearByMeal: "Clear by meal",
    confirmClearAll: "Are you sure you want to clear the entire grocery list?",
    itemsCleared: "Items cleared",
    removeIngredientsFromGrocery: "Do you also want to remove the ingredients from the grocery list?",
    yesRemove: "Yes, remove",
    login: "Log in",
    logout: "Log out",
    welcomeMessage: "Your family meal planning assistant",
    loginHint: "Sign in with Google, GitHub, Apple, or email",
    planMealsDesc: "Plan your family meals for the entire week",
    manageRecipesDesc: "Save and organize your favorite recipes",
    groceryListDesc: "Generate shopping lists from your meal plan",
    sharing: "Sharing",
    sharingDesc: "Invite family members to view your weekly plan",
    inviteFamily: "Invite family member",
    enterEmail: "Email address",
    sendInvite: "Send invite",
    pendingInvites: "Pending invites",
    acceptedShares: "Active shares",
    sharedWithMe: "Shared with me",
    viewPlan: "View plan",
    permission: "Permission",
    viewOnly: "Can view",
    canEdit: "Can edit",
    revoke: "Remove",
    inviteSent: "Invite sent",
    noShares: "No shares yet",
    noSharedWithMe: "No one has shared their plan with you yet",
    acceptInvite: "Accept invite",
    viewingPlanOf: "Viewing plan of",
    backToMyPlan: "Back to my plan",
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
