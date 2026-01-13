import { useState } from "react";
import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { useStore, GroceryItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, RefreshCw, CheckCircle2, Circle, MoreVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function GroceryList() {
  const { t } = useTranslation();
  const { groceryItems, addGroceryItem, toggleGroceryItem, deleteGroceryItem, clearBoughtItems, clearAllItems, deleteItemsByMeal, getSourceMeals, regenerateGroceryList } = useStore();
  const { toast } = useToast();
  
  const [newItem, setNewItem] = useState("");
  const [isMealDialogOpen, setIsMealDialogOpen] = useState(false);
  
  const sourceMeals = getSourceMeals();

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newItem.trim()) return;
    addGroceryItem(newItem);
    setNewItem("");
  };

  const handleRegenerate = () => {
    if (confirm("This will add items from your weekly plan to the list. Continue?")) {
      regenerateGroceryList();
      toast({ title: "List Updated", description: "Items from weekly plan added." });
    }
  };

  const sortedItems = [...groceryItems].sort((a, b) => {
    if (a.isBought === b.isBought) return 0;
    return a.isBought ? 1 : -1;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-display font-bold">{t("groceryList")}</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRegenerate}
              className="rounded-full border-primary/20 text-primary hover:bg-primary/5 text-xs"
            >
              <RefreshCw size={14} className="mr-1.5" />
              {t("generatedFromPlan")}
            </Button>
            
            {groceryItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" data-testid="button-grocery-menu">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  {sourceMeals.length > 0 && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => setIsMealDialogOpen(true)}
                        className="text-sm"
                        data-testid="menu-item-clear-by-meal"
                      >
                        <X size={14} className="mr-2" />
                        {t("clearByMeal")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem 
                    onClick={() => {
                      if (confirm(t("confirmClearAll"))) {
                        clearAllItems();
                        toast({ title: t("itemsCleared") });
                      }
                    }}
                    className="text-sm text-destructive"
                    data-testid="menu-item-clear-all"
                  >
                    <Trash2 size={14} className="mr-2" />
                    {t("clearAll")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Add Item Input */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input 
            value={newItem} 
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={t("addItem") + "..."}
            className="rounded-xl bg-card border-none shadow-sm h-12"
          />
          <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shrink-0 bg-primary hover:bg-primary/90">
            <Plus />
          </Button>
        </form>

        {groceryItems.length === 0 ? (
          <div className="text-center py-12 opacity-50 border-2 border-dashed border-border rounded-2xl">
            <p>{t("noItems")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedItems.map(item => (
              <GroceryListItem 
                key={item.id} 
                item={item} 
                onToggle={() => toggleGroceryItem(item.id)}
                onDelete={() => deleteGroceryItem(item.id)}
              />
            ))}
          </div>
        )}
        
        {groceryItems.some(i => i.isBought) && (
          <div className="pt-4 flex justify-center">
            <Button 
              variant="ghost" 
              onClick={clearBoughtItems} 
              className="text-muted-foreground hover:text-destructive text-xs"
            >
              <Trash2 size={14} className="mr-2" />
              {t("clearBought")}
            </Button>
          </div>
        )}
      </div>

      {/* Clear by Meal Dialog */}
      <Dialog open={isMealDialogOpen} onOpenChange={setIsMealDialogOpen}>
        <DialogContent className="rounded-2xl w-[90%] max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("clearByMeal")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {sourceMeals.map(mealName => {
              const count = groceryItems.filter(i => i.sourceMeal === mealName && !i.isBought).length;
              return (
                <button
                  key={mealName}
                  onClick={() => {
                    deleteItemsByMeal(mealName);
                    toast({ title: t("itemsCleared"), description: `${count} ${mealName}` });
                    if (sourceMeals.length === 1) {
                      setIsMealDialogOpen(false);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  data-testid={`button-clear-meal-${mealName}`}
                >
                  <span className="font-medium">{mealName}</span>
                  <span className="text-sm text-muted-foreground">{count} varor</span>
                </button>
              );
            })}
          </div>
          <Button variant="outline" onClick={() => setIsMealDialogOpen(false)} className="rounded-xl mt-2">
            {t("cancel")}
          </Button>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function GroceryListItem({ item, onToggle, onDelete }: { item: GroceryItem, onToggle: () => void, onDelete: () => void }) {
  return (
    <div 
      className={cn(
        "group flex items-center justify-between p-3 rounded-xl transition-all duration-300",
        item.isBought ? "bg-muted/30 opacity-60" : "bg-card shadow-sm border border-border/50"
      )}
    >
      <div 
        onClick={onToggle}
        className="flex items-center gap-3 flex-1 cursor-pointer select-none"
      >
        <div className={cn("transition-colors duration-300", item.isBought ? "text-primary" : "text-muted-foreground/50")}>
          {item.isBought ? <CheckCircle2 size={24} className="fill-primary/10" /> : <Circle size={24} />}
        </div>
        <div>
          <span className={cn(
            "font-medium transition-all duration-300",
            item.isBought ? "line-through text-muted-foreground" : "text-foreground"
          )}>
            {item.name}
          </span>
          {item.sourceMeal && !item.isBought && (
            <div className="text-[10px] text-muted-foreground">For: {item.sourceMeal}</div>
          )}
        </div>
      </div>
      
      <button 
        onClick={onDelete}
        className="p-2 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
