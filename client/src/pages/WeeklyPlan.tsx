import { useState, useMemo, useRef, useCallback, memo } from "react";
import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { useStore, Meal } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Utensils, Coffee, GripVertical, ArrowLeft, Users, Archive, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MealPlanShare } from "@shared/schema";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Link } from "wouter";
import { startOfWeek, addWeeks, format, getISOWeek } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { RecipeDetailDialog } from "@/components/RecipeDetailDialog";
import type { Recipe } from "@/lib/store";

// Simple fuzzy match - checks if all characters in query appear in order in target
function fuzzyMatch(query: string, target: string): { match: boolean; score: number } {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  
  if (t.includes(q)) {
    return { match: true, score: 100 - t.indexOf(q) }; // Exact substring match gets high score
  }
  
  let qi = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;
  
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
    } else {
      consecutiveMatches = 0;
    }
  }
  
  if (qi === q.length) {
    return { match: true, score: maxConsecutive * 10 + (q.length / t.length) * 50 };
  }
  
  return { match: false, score: 0 };
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Helper to get the start of the week (Monday)
function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

// Format weekStart as ISO date string (YYYY-MM-DD)
function formatWeekStartDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export default function WeeklyPlan() {
  const { t, language } = useTranslation();
  const { meals, addMeal, deleteMeal, moveMeal, recipes, addIngredientsToGrocery, groceryItems, deleteItemsByMeal, settings } = useStore();
  const { toast } = useToast();
  
  // Week navigation state
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const currentWeekStart = useMemo(() => getWeekStart(new Date()), []);
  const isCurrentWeek = formatWeekStartDate(selectedWeekStart) === formatWeekStartDate(currentWeekStart);
  const weekNumber = getISOWeek(selectedWeekStart);
  const selectedWeekStartStr = formatWeekStartDate(selectedWeekStart);
  const dateLocale = language === 'sv' ? sv : enUS;
  
  const goToPreviousWeek = () => setSelectedWeekStart(prev => addWeeks(prev, -1));
  const goToNextWeek = () => setSelectedWeekStart(prev => addWeeks(prev, 1));
  const goToCurrentWeek = () => setSelectedWeekStart(getWeekStart(new Date()));
  
  // Check if viewing a shared plan
  const [viewingShare, setViewingShare] = useState<MealPlanShare | null>(() => {
    const stored = localStorage.getItem('viewing-shared-plan');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Fetch shared plan meals if viewing someone else's plan
  const { data: sharedMeals = [] } = useQuery<Meal[]>({
    queryKey: ['/api/shares', viewingShare?.id, 'meals'],
    queryFn: async () => {
      if (!viewingShare) return [];
      const res = await fetch(`/api/shares/${viewingShare.id}/meals`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch shared meals');
      return res.json();
    },
    enabled: !!viewingShare,
  });

  const exitSharedView = () => {
    localStorage.removeItem('viewing-shared-plan');
    setViewingShare(null);
  };

  // Use shared meals or own meals depending on what we're viewing
  // Filter meals by the selected week
  const allMeals = viewingShare ? sharedMeals : meals;
  const displayMeals = useMemo(() => {
    return allMeals.filter(meal => {
      // Meals without weekStart are considered as current week (for backward compatibility)
      if (!meal.weekStart) {
        return isCurrentWeek;
      }
      return meal.weekStart === selectedWeekStartStr;
    });
  }, [allMeals, selectedWeekStartStr, isCurrentWeek]);
  const isReadOnly = !!viewingShare;
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<string>("Monday");
  const [activeType, setActiveType] = useState<string>("Lunch");
  const [newMealName, setNewMealName] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);

  const [isIngredientConfirmOpen, setIsIngredientConfirmOpen] = useState(false);
  const [pendingIngredients, setPendingIngredients] = useState<string[]>([]);

  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [mealToMove, setMealToMove] = useState<Meal | null>(null);
  const [moveTargetDay, setMoveTargetDay] = useState<string>("");
  const [moveTargetType, setMoveTargetType] = useState<string>("Lunch");
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null);
  const [hasIngredientsInGrocery, setHasIngredientsInGrocery] = useState(false);
  
  // Drag and drop state
  const [activeDragMeal, setActiveDragMeal] = useState<Meal | null>(null);
  
  // Recipe dialog state
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  
  const handleRecipeClick = useCallback((meal: Meal) => {
    if (meal.recipeId) {
      const recipe = recipes.find(r => r.id === meal.recipeId);
      if (recipe) {
        setViewingRecipe(recipe);
        setRecipeDialogOpen(true);
      }
    }
  }, [recipes]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const mealId = event.active.id as number;
    const meal = displayMeals.find(m => m.id === mealId);
    if (meal) {
      setActiveDragMeal(meal);
    }
  }, [displayMeals]);
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragMeal(null);
    
    if (!over) return;
    
    const mealId = active.id as number;
    const dropTarget = over.id as string;
    
    // Parse drop target: format is "day-type" e.g. "Monday-Lunch"
    const [targetDay, targetType] = dropTarget.split('-');
    
    if (targetDay && targetType) {
      moveMeal(mealId, targetDay, targetType);
      toast({ 
        title: t("mealMoved") || "Meal moved", 
        description: `${t(targetDay.toLowerCase() as any)} ${t(targetType.toLowerCase() as any)}` 
      });
    }
  }, [moveMeal, toast, t]);
  
  const handleDeleteMeal = useCallback((meal: Meal) => {
    // Check if this meal has ingredients in the grocery list
    const hasIngredients = groceryItems.some(item => item.sourceMeal === meal.name && !item.isBought);
    
    if (hasIngredients) {
      setMealToDelete(meal);
      setHasIngredientsInGrocery(true);
      setIsDeleteConfirmOpen(true);
    } else {
      // No ingredients in grocery list, just delete
      deleteMeal(meal.id);
      toast({ title: t("delete"), description: meal.name });
    }
  }, [groceryItems, deleteMeal, toast, t]);
  
  const confirmDeleteMeal = (removeIngredients: boolean) => {
    if (!mealToDelete) return;
    
    if (removeIngredients) {
      deleteItemsByMeal(mealToDelete.name);
    }
    
    deleteMeal(mealToDelete.id);
    toast({ title: t("delete"), description: mealToDelete.name });
    
    setIsDeleteConfirmOpen(false);
    setMealToDelete(null);
  };
  
  // Get filtered and sorted recipe suggestions based on input
  const suggestions = useMemo(() => {
    if (!newMealName || newMealName.length < 1) return [];
    
    const matches = recipes
      .map(recipe => ({
        recipe,
        ...fuzzyMatch(newMealName, recipe.name)
      }))
      .filter(r => r.match)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    return matches.map(m => m.recipe);
  }, [newMealName, recipes]);

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
      recipeId: selectedRecipeId || undefined,
      weekStart: selectedWeekStartStr
    });
    
    setNewMealName("");
    setSelectedRecipeId(null);
    setIsAddOpen(false);
    
    if (selectedRecipeId) {
      const r = recipes.find(rc => rc.id === selectedRecipeId);
      if (r && r.ingredients.length > 0) {
        setPendingIngredients(r.ingredients);
        setIsIngredientConfirmOpen(true);
      }
    }
    
    toast({ title: "Meal added", description: `${name} added to ${activeDay} ${activeType}` });
  };

  const handleMoveMeal = () => {
    if (!mealToMove || !moveTargetDay) return;
    
    moveMeal(mealToMove.id, moveTargetDay, moveTargetType);
    
    setIsMoveOpen(false);
    setMealToMove(null);
    toast({ title: "Meal moved", description: `Moved to ${moveTargetDay} ${moveTargetType}` });
  };

  const getMealsForDay = (day: string) => ({
    breakfast: displayMeals.filter(m => m.day === day && m.type === "Breakfast"),
    lunch: displayMeals.filter(m => m.day === day && m.type === "Lunch"),
    dinner: displayMeals.filter(m => m.day === day && m.type === "Dinner"),
  });

  const workDays = settings?.workDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const workShift = settings?.workShift || 'day';
  const breakfastDays = settings?.breakfastDays || [];

  const archiveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/week-history/archive', { weekStart: selectedWeekStartStr });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/week-history'] });
      toast({ title: t("weekArchived") });
    },
  });

  return (
    <Layout>
      <DndContext 
        sensors={sensors} 
        onDragStart={isReadOnly ? undefined : handleDragStart} 
        onDragEnd={isReadOnly ? undefined : handleDragEnd}
      >
      {viewingShare && (
        <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between" data-testid="shared-plan-banner">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <span className="text-sm font-medium">
              {t("viewingPlanOf")} {viewingShare.ownerName || 'Unknown'}
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={exitSharedView} data-testid="button-exit-shared-view">
            <ArrowLeft size={16} className="mr-1" />
            {t("backToMyPlan")}
          </Button>
        </div>
      )}

      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-display font-bold">{t("weeklyPlan")}</h2>
          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <>
                <Link href="/history">
                  <Button size="sm" variant="outline" className="rounded-full" data-testid="button-history">
                    <Clock size={16} className="mr-1" /> {t("history")}
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => archiveMutation.mutate()} 
                  disabled={archiveMutation.isPending}
                  className="rounded-full"
                  data-testid="button-archive-week"
                >
                  <Archive size={16} className="mr-1" /> {t("archiveWeek")}
                </Button>
                <Button size="sm" onClick={() => setIsAddOpen(true)} className="rounded-full shadow-md bg-primary hover:bg-primary/90">
                  <Plus size={18} className="mr-1" /> {t("add")}
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-3 bg-card rounded-xl p-2 border border-border/60">
          <Button size="icon" variant="ghost" onClick={goToPreviousWeek} data-testid="button-previous-week">
            <ChevronLeft size={20} />
          </Button>
          <div className="flex items-center gap-2 min-w-[180px] justify-center">
            <span className="font-bold text-lg">{t("week")} {weekNumber}</span>
            {!isCurrentWeek && (
              <Button size="sm" variant="ghost" onClick={goToCurrentWeek} className="text-xs px-2 text-primary underline" data-testid="button-this-week">
                {t("thisWeek")}
              </Button>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={goToNextWeek} data-testid="button-next-week">
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      <div className="space-y-6 pb-8">
        {DAYS.map((day) => {
          const dayMeals = getMealsForDay(day);
          const dayLabel = t(day.toLowerCase() as any);
          const isWorkDay = workDays.includes(day);
          const showBreakfast = breakfastDays.includes(day);
          // On work days: hide lunch for day shift, hide dinner for evening shift
          const showLunch = !isWorkDay || workShift === 'evening';
          const showDinner = !isWorkDay || workShift === 'day';
          
          return (
            <div key={day} className="bg-card rounded-2xl p-4 shadow-sm border border-border/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-1 bg-primary/30 rounded-full" />
                <h3 className="text-lg font-bold text-foreground/80">{dayLabel}</h3>
              </div>

              <div className="space-y-3">
                {/* Breakfast Section */}
                {showBreakfast && (
                  <div className="relative">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Coffee size={12} /> {t("breakfast")}
                    </div>
                    <DroppableSlot id={`${day}-Breakfast`} isEmpty={dayMeals.breakfast.length === 0}>
                      {dayMeals.breakfast.length === 0 ? (
                        !isReadOnly && (
                          <div 
                            onClick={() => { setActiveDay(day); setActiveType('Breakfast'); setIsAddOpen(true); }}
                            className="border-2 border-dashed border-border rounded-xl p-3 text-sm text-center text-muted-foreground/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all"
                            data-testid={`add-breakfast-${day.toLowerCase()}`}
                          >
                            {t("addMeal")}
                          </div>
                        )
                      ) : (
                        <div className="space-y-2">
                          {dayMeals.breakfast.map(meal => (
                            <DraggableMealItem 
                              key={meal.id} 
                              meal={meal} 
                              isDraggable={!isReadOnly}
                              onDelete={isReadOnly ? undefined : () => handleDeleteMeal(meal)}
                              onRecipeClick={handleRecipeClick}
                            />
                          ))}
                        </div>
                      )}
                    </DroppableSlot>
                  </div>
                )}

                {/* Divider after breakfast */}
                {showBreakfast && (showLunch || showDinner) && <div className="border-t border-border/40 my-2" />}

                {/* Lunch Section */}
                {showLunch && (
                  <div className="relative">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Coffee size={12} /> {t("lunch")}
                    </div>
                    <DroppableSlot id={`${day}-Lunch`} isEmpty={dayMeals.lunch.length === 0}>
                      {dayMeals.lunch.length === 0 ? (
                        !isReadOnly && (
                          <div 
                            onClick={() => { setActiveDay(day); setActiveType('Lunch'); setIsAddOpen(true); }}
                            className="border-2 border-dashed border-border rounded-xl p-3 text-sm text-center text-muted-foreground/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all"
                            data-testid={`add-lunch-${day.toLowerCase()}`}
                          >
                            {t("addMeal")}
                          </div>
                        )
                      ) : (
                        <div className="space-y-2">
                          {dayMeals.lunch.map(meal => (
                            <DraggableMealItem 
                              key={meal.id} 
                              meal={meal} 
                              isDraggable={!isReadOnly}
                              onDelete={isReadOnly ? undefined : () => handleDeleteMeal(meal)}
                              onRecipeClick={handleRecipeClick}
                            />
                          ))}
                        </div>
                      )}
                    </DroppableSlot>
                  </div>
                )}

                {/* Divider between lunch and dinner */}
                {showLunch && showDinner && <div className="border-t border-border/40 my-2" />}

                {/* Dinner Section */}
                {showDinner && (
                  <div className="relative">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Utensils size={12} /> {t("dinner")}
                    </div>
                    <DroppableSlot id={`${day}-Dinner`} isEmpty={dayMeals.dinner.length === 0}>
                      {dayMeals.dinner.length === 0 ? (
                        !isReadOnly && (
                          <div 
                            onClick={() => { setActiveDay(day); setActiveType('Dinner'); setIsAddOpen(true); }}
                            className="border-2 border-dashed border-border rounded-xl p-3 text-sm text-center text-muted-foreground/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all"
                            data-testid={`add-dinner-${day.toLowerCase()}`}
                          >
                            {t("addMeal")}
                          </div>
                        )
                      ) : (
                        <div className="space-y-2">
                          {dayMeals.dinner.map(meal => (
                            <DraggableMealItem 
                              key={meal.id} 
                              meal={meal} 
                              isDraggable={!isReadOnly}
                              onDelete={isReadOnly ? undefined : () => handleDeleteMeal(meal)}
                              onRecipeClick={handleRecipeClick}
                            />
                          ))}
                        </div>
                      )}
                    </DroppableSlot>
                  </div>
                )}
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
              <div className="relative">
                <Input 
                  ref={inputRef}
                  value={newMealName} 
                  onChange={(e) => { 
                    setNewMealName(e.target.value); 
                    setSelectedRecipeId(null); 
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => setShowSuggestions(false), 150);
                  }}
                  placeholder="Type name or select below..."
                  className="rounded-xl bg-muted/30"
                  data-testid="input-meal-name"
                  autoComplete="off"
                />
                {/* Autocomplete suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    {suggestions.map((recipe) => (
                      <button
                        key={recipe.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setNewMealName(recipe.name);
                          setSelectedRecipeId(recipe.id);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                        data-testid={`suggestion-${recipe.id}`}
                      >
                        <span className="flex-1">{recipe.name}</span>
                        <span className="text-xs text-muted-foreground">{recipe.ingredients.length} ing.</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">{t("favorites")}</Label>
              <div className="flex flex-wrap gap-2">
                {recipes.slice(0, 5).map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRecipeId(r.id); setNewMealName(r.name); setShowSuggestions(false); }}
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

      {/* Ingredient Confirmation Dialog */}
      <Dialog open={isIngredientConfirmOpen} onOpenChange={setIsIngredientConfirmOpen}>
        <DialogContent className="rounded-2xl w-[90%] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{t("addIngredientsToGrocery")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-4">
            <Button 
              onClick={() => {
                addIngredientsToGrocery(pendingIngredients);
                setIsIngredientConfirmOpen(false);
                toast({ title: "Grocery list updated", description: `${pendingIngredients.length} ingredients added.` });
              }}
              className="rounded-xl bg-primary text-primary-foreground"
            >
              {t("yesAdd")}
            </Button>
            <Button variant="outline" onClick={() => setIsIngredientConfirmOpen(false)} className="rounded-xl">
              {t("no")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Meal Dialog */}
      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent className="rounded-2xl w-[90%] max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("move")} {mealToMove?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("monday")}</Label>
              <Select value={moveTargetDay} onValueChange={setMoveTargetDay}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => (
                    <SelectItem key={d} value={d}>{t(d.toLowerCase() as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("lunch")}</Label>
              <Select value={moveTargetType} onValueChange={(v: any) => setMoveTargetType(v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">{t("breakfast")}</SelectItem>
                  <SelectItem value="lunch">{t("lunch")}</SelectItem>
                  <SelectItem value="dinner">{t("dinner")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsMoveOpen(false)} className="rounded-xl">{t("cancel")}</Button>
            <Button onClick={handleMoveMeal} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">{t("move")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Meal Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="rounded-2xl w-[90%] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{t("removeIngredientsFromGrocery")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-4">
            <Button 
              onClick={() => confirmDeleteMeal(true)}
              className="rounded-xl bg-primary text-primary-foreground"
              data-testid="button-delete-with-ingredients"
            >
              {t("yesRemove")}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => confirmDeleteMeal(false)} 
              className="rounded-xl"
              data-testid="button-delete-keep-ingredients"
            >
              {t("no")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Drag Overlay - shows what's being dragged */}
      <DragOverlay>
        {activeDragMeal ? (
          <div className="bg-card border border-primary shadow-lg rounded-xl p-3 opacity-90">
            <div className="font-medium text-sm text-foreground">{activeDragMeal.name}</div>
          </div>
        ) : null}
      </DragOverlay>
      </DndContext>

      <RecipeDetailDialog
        recipe={viewingRecipe}
        open={recipeDialogOpen}
        onOpenChange={setRecipeDialogOpen}
      />
    </Layout>
  );
}

// Droppable slot component for meal slots
function DroppableSlot({ id, children, isEmpty }: { id: string; children: React.ReactNode; isEmpty?: boolean }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "min-h-[40px] rounded-xl transition-colors",
        isOver && "bg-primary/10 ring-2 ring-primary/30",
        isEmpty && isOver && "bg-primary/20"
      )}
    >
      {children}
    </div>
  );
}

// Draggable meal item component - memoized for performance
const DraggableMealItem = memo(function DraggableMealItem({ meal, onDelete, isDraggable, onRecipeClick }: { meal: Meal; onDelete?: () => void; isDraggable: boolean; onRecipeClick?: (meal: Meal) => void }) {
  const { recipes } = useStore();
  const recipe = meal.recipeId ? recipes.find(r => r.id === meal.recipeId) : null;
  
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: meal.id,
    disabled: !isDraggable,
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "group flex items-center justify-between bg-muted/30 rounded-xl p-3 hover:bg-muted/60 transition-colors",
        isDragging && "opacity-50",
        recipe && "cursor-pointer"
      )}
      onClick={() => recipe && onRecipeClick?.(meal)}
      data-testid={`meal-item-${meal.id}`}
    >
      {isDraggable && (
        <div 
          {...listeners} 
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 mr-1 text-muted-foreground hover:text-foreground touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>
      )}
      <div className="flex-1">
        <div className="font-medium text-sm text-foreground">{meal.name}</div>
        {recipe && (
          <div className="text-[10px] text-muted-foreground bg-background/50 inline-block px-1.5 rounded-sm mt-0.5">
            Recipe
          </div>
        )}
      </div>
      {onDelete && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
        >
          <X size={16} />
        </Button>
      )}
    </div>
  );
});
