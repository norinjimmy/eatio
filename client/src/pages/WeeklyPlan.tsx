import { useState } from "react";
import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { useStore, Meal } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Utensils, Coffee, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeeklyPlan() {
  const { t } = useTranslation();
  const { meals, addMeal, deleteMeal, moveMeal, recipes } = useStore();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<string>("Monday");
  const [activeType, setActiveType] = useState<'lunch' | 'dinner'>("lunch");
  const [newMealName, setNewMealName] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");

  const handleAddMeal = () => {
    if (!newMealName && !selectedRecipeId) return;
    
    let name = newMealName;
    if (selectedRecipeId) {
      const r = recipes.find(rc => rc.id === selectedRecipeId);
      if (r) name = r.name;
    }

    addMeal({
      day: activeDay,
      type: activeType,
      name: name,
      recipeId: selectedRecipeId || undefined
    });
    
    setNewMealName("");
    setSelectedRecipeId("");
    setIsAddOpen(false);
    toast({ title: "Meal added", description: `${name} added to ${activeDay} ${activeType}` });
  };

  const getMealsForDay = (day: string) => ({
    lunch: meals.filter(m => m.day === day && m.type === "lunch"),
    dinner: meals.filter(m => m.day === day && m.type === "dinner"),
  });

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">{t("weeklyPlan")}</h2>
        <Button size="sm" onClick={() => setIsAddOpen(true)} className="rounded-full shadow-md bg-primary hover:bg-primary/90">
          <Plus size={18} className="mr-1" /> {t("add")}
        </Button>
      </div>

      <div className="space-y-6 pb-8">
        {DAYS.map((day) => {
          const dayMeals = getMealsForDay(day);
          const dayLabel = t(day.toLowerCase() as any);
          
          return (
            <div key={day} className="bg-card rounded-2xl p-4 shadow-sm border border-border/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-1 bg-primary/30 rounded-full" />
                <h3 className="text-lg font-bold text-foreground/80">{dayLabel}</h3>
              </div>

              <div className="space-y-3">
                {/* Lunch Section */}
                <div className="relative">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Coffee size={12} /> {t("lunch")}
                  </div>
                  {dayMeals.lunch.length === 0 ? (
                    <div 
                      onClick={() => { setActiveDay(day); setActiveType('lunch'); setIsAddOpen(true); }}
                      className="border-2 border-dashed border-border rounded-xl p-3 text-sm text-center text-muted-foreground/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all"
                    >
                      {t("addMeal")}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayMeals.lunch.map(meal => (
                        <MealItem key={meal.id} meal={meal} onDelete={() => deleteMeal(meal.id)} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-border/40 my-2" />

                {/* Dinner Section */}
                <div className="relative">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Utensils size={12} /> {t("dinner")}
                  </div>
                  {dayMeals.dinner.length === 0 ? (
                    <div 
                      onClick={() => { setActiveDay(day); setActiveType('dinner'); setIsAddOpen(true); }}
                      className="border-2 border-dashed border-border rounded-xl p-3 text-sm text-center text-muted-foreground/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all"
                    >
                      {t("addMeal")}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayMeals.dinner.map(meal => (
                        <MealItem key={meal.id} meal={meal} onDelete={() => deleteMeal(meal.id)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Meal Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-2xl w-[90%] max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addMeal")} - {t(activeDay.toLowerCase() as any)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("recipeName")}</Label>
              <Input 
                value={newMealName} 
                onChange={(e) => { setNewMealName(e.target.value); setSelectedRecipeId(""); }}
                placeholder="Type name or select below..."
                className="rounded-xl bg-muted/30"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">{t("favorites")}</Label>
              <div className="flex flex-wrap gap-2">
                {recipes.slice(0, 5).map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRecipeId(r.id); setNewMealName(r.name); }}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-colors",
                      selectedRecipeId === r.id 
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">{t("cancel")}</Button>
            <Button onClick={handleAddMeal} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">{t("save")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function MealItem({ meal, onDelete }: { meal: Meal; onDelete: () => void }) {
  const { recipes } = useStore();
  const recipe = meal.recipeId ? recipes.find(r => r.id === meal.recipeId) : null;

  return (
    <div className="group flex items-center justify-between bg-muted/30 rounded-xl p-3 hover:bg-muted/60 transition-colors">
      <div className="flex-1">
        <div className="font-medium text-sm text-foreground">{meal.name}</div>
        {recipe && (
          <div className="text-[10px] text-muted-foreground bg-background/50 inline-block px-1.5 rounded-sm mt-0.5">
            Recipe
          </div>
        )}
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </Button>
    </div>
  );
}
