import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { useStore, Recipe } from "@/lib/store";
import { ArrowRight, Utensils, CalendarDays, ShoppingBag, TrendingUp, Plus } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { t } = useTranslation();
  const { meals, recipes, groceryItems, settings, addMeal, addIngredientsToGrocery } = useStore();
  const { toast } = useToast();
  
  const [isAddToPlanOpen, setIsAddToPlanOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMealType, setSelectedMealType] = useState("Dinner");
  
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Get top recipes sorted by usage count
  const topRecipes = [...recipes]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5)
    .filter(r => r.usageCount > 0);
  
  const handleAddRecipeToPlan = () => {
    if (!selectedRecipe || !selectedDay) return;
    
    addMeal({
      day: selectedDay,
      type: selectedMealType,
      name: selectedRecipe.name,
      recipeId: selectedRecipe.id,
    });
    
    if (selectedRecipe.ingredients.length > 0) {
      addIngredientsToGrocery(selectedRecipe.ingredients, selectedRecipe.name);
    }
    
    toast({ 
      title: t("mealAdded") || "Meal added", 
      description: `${selectedRecipe.name} ${t(selectedDay.toLowerCase() as any)} ${t(selectedMealType.toLowerCase() as any)}` 
    });
    
    setIsAddToPlanOpen(false);
    setSelectedRecipe(null);
    setSelectedDay("");
  };
  
  const openAddToPlan = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsAddToPlanOpen(true);
  };

  const workDays = settings?.workDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysMealsList = meals.filter(m => m.day === today);
  const lunch = todaysMealsList.find(m => m.type === 'Lunch');
  const dinner = todaysMealsList.find(m => m.type === 'Dinner');
  const isWorkDay = workDays.includes(today);

  const plannedDaysCount = DAYS.filter(day => 
    meals.some(m => m.day === day)
  ).length;

  const totalRecipes = recipes.length;
  const itemsToBuy = groceryItems.filter(i => !i.isBought).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning");
    if (hour < 18) return t("goodAfternoon");
    return t("goodEvening");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-foreground">
            {getGreeting()}
          </h2>
          <p className="text-muted-foreground">
            {t("todaysMeals")}
          </p>
        </div>

        {/* Current Day Meals */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="border-none shadow-md bg-card overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col divide-y divide-border/40">
                {!isWorkDay && (
                  <div className="p-5 flex items-center justify-between group cursor-pointer hover:bg-primary/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Utensils size={24} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                          {t("lunch")}
                        </div>
                        <div className="font-bold text-lg text-foreground">
                          {lunch ? lunch.name : <span className="text-muted-foreground/30 italic font-normal">Inget planerat</span>}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                )}
                <div className="p-5 flex items-center justify-between group cursor-pointer hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                      <Utensils size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                        {t("dinner")}
                      </div>
                      <div className="font-bold text-lg text-foreground">
                        {dinner ? dinner.name : <span className="text-muted-foreground/30 italic font-normal">Inget planerat</span>}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-none shadow-sm group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <CalendarDays size={24} />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-foreground">{plannedDaysCount}/7</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("plannedDays")}</div>
              </div>
              <div className="h-2 w-24 bg-indigo-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-500" 
                  style={{ width: `${(plannedDaysCount / 7) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/recipes" className="cursor-pointer">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-none shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Utensils size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{totalRecipes}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("totalRecipes")}</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/grocery" className="cursor-pointer">
            <Card className="bg-gradient-to-br from-secondary to-secondary/50 border-none shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-orange-200/50 flex items-center justify-center text-orange-700 group-hover:scale-110 transition-transform">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{itemsToBuy}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("itemsToBuy")}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Top Recipes Section */}
        {topRecipes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              <h3 className="font-bold text-foreground">{t("topRecipes")}</h3>
            </div>
            <Card className="border-none shadow-sm">
              <CardContent className="p-0 divide-y divide-border/40">
                {topRecipes.map((recipe) => (
                  <div 
                    key={recipe.id} 
                    className="p-4 flex items-center justify-between group hover:bg-primary/5 transition-colors"
                    data-testid={`top-recipe-${recipe.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{recipe.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {t("usedTimes").replace("{count}", String(recipe.usageCount))}
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => openAddToPlan(recipe)}
                      className="opacity-50 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-add-to-plan-${recipe.id}`}
                    >
                      <Plus size={18} />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add to Plan Dialog */}
      <Dialog open={isAddToPlanOpen} onOpenChange={setIsAddToPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addToPlan")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {selectedRecipe && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium">{selectedRecipe.name}</div>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("selectDay")}</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger data-testid="select-day-trigger">
                  <SelectValue placeholder={t("selectDay")} />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day} data-testid={`select-day-${day.toLowerCase()}`}>
                      {t(day.toLowerCase() as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("mealType")}</Label>
              <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                <SelectTrigger data-testid="select-meal-type-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Breakfast" data-testid="select-meal-type-breakfast">{t("breakfast")}</SelectItem>
                  <SelectItem value="Lunch" data-testid="select-meal-type-lunch">{t("lunch")}</SelectItem>
                  <SelectItem value="Dinner" data-testid="select-meal-type-dinner">{t("dinner")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAddRecipeToPlan} 
              disabled={!selectedDay}
              className="w-full"
              data-testid="button-confirm-add-to-plan"
            >
              {t("add")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
