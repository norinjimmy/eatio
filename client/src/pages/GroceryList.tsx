import { useState } from "react";
import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { useStore, GroceryItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, RefreshCw, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function GroceryList() {
  const { t } = useTranslation();
  const { groceryItems, addGroceryItem, toggleGroceryItem, deleteGroceryItem, clearBoughtItems, regenerateGroceryList } = useStore();
  const { toast } = useToast();
  
  const [newItem, setNewItem] = useState("");

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold">{t("groceryList")}</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRegenerate}
            className="rounded-full border-primary/20 text-primary hover:bg-primary/5 text-xs"
          >
            <RefreshCw size={14} className="mr-1.5" />
            {t("generatedFromPlan")}
          </Button>
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
