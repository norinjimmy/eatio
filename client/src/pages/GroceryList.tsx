import { useState } from "react";
import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { useStore, GroceryItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, RefreshCw, CheckCircle2, Circle, MoreVertical, Apple, Milk, Beef, Snowflake, Croissant, Package, Coffee, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CATEGORY_NAMES, CATEGORY_ORDER, type GroceryCategory } from "@shared/ingredient-utils";

// Category icons
const CATEGORY_ICONS: Record<GroceryCategory, React.ReactNode> = {
  vegetables: <Apple size={16} />,
  dairy: <Milk size={16} />,
  meat: <Beef size={16} />,
  frozen: <Snowflake size={16} />,
  bread: <Croissant size={16} />,
  pantry: <Package size={16} />,
  beverages: <Coffee size={16} />,
  other: <HelpCircle size={16} />,
};

export default function GroceryList() {
  const { t, language } = useTranslation();
  const { groceryItems, addGroceryItem, toggleGroceryItem, deleteGroceryItem, clearBoughtItems, clearAllItems, regenerateGroceryList } = useStore();
  const { toast } = useToast();
  
  const [newItem, setNewItem] = useState("");

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newItem.trim()) return;
    addGroceryItem(newItem);
    setNewItem("");
  };

  const handleRegenerate = () => {
    const confirmMsg = language === 'sv' 
      ? "Detta lägger till varor från din veckoplan till listan. Fortsätt?" 
      : "This will add items from your weekly plan to the list. Continue?";
    if (confirm(confirmMsg)) {
      regenerateGroceryList();
      const title = language === 'sv' ? "Lista uppdaterad" : "List Updated";
      const desc = language === 'sv' ? "Varor från veckoplan tillagda." : "Items from weekly plan added.";
      toast({ title, description: desc });
    }
  };
  
  // Group items by category
  const groupedItems = CATEGORY_ORDER.reduce((acc, category) => {
    const categoryItems = groceryItems.filter(item => 
      (item.category || 'other') === category
    );
    if (categoryItems.length > 0) {
      // Sort: unbought first, then bought
      acc[category] = categoryItems.sort((a, b) => {
        if (a.isBought === b.isBought) return 0;
        return a.isBought ? 1 : -1;
      });
    }
    return acc;
  }, {} as Record<GroceryCategory, GroceryItem[]>);
  
  // Collect bought items from all categories
  const boughtItems = groceryItems.filter(i => i.isBought);

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
              className="rounded-full text-xs"
              data-testid="button-regenerate-list"
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
        <form onSubmit={handleAdd} className="flex gap-2" data-testid="form-add-item">
          <Input 
            value={newItem} 
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={t("addItem") + "..."}
            className="rounded-xl bg-card border-none shadow-sm h-12"
            data-testid="input-new-item"
          />
          <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shrink-0" data-testid="button-add-item">
            <Plus />
          </Button>
        </form>

        {groceryItems.length === 0 ? (
          <div className="text-center py-12 opacity-50 border-2 border-dashed border-border rounded-2xl">
            <p>{t("noItems")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {CATEGORY_ORDER.map(category => {
              const items = groupedItems[category];
              if (!items || items.length === 0) return null;
              
              const categoryName = language === 'sv' 
                ? CATEGORY_NAMES[category].sv 
                : CATEGORY_NAMES[category].en;
              
              return (
                <div key={category} className="space-y-2" data-testid={`category-${category}`}>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span className="text-primary">{CATEGORY_ICONS[category]}</span>
                    <span>{categoryName}</span>
                    <span className="text-xs opacity-60">({items.filter(i => !i.isBought).length})</span>
                  </div>
                  <div className="space-y-1.5 pl-1">
                    {items.map(item => (
                      <GroceryListItem 
                        key={item.id} 
                        item={item} 
                        onToggle={() => toggleGroceryItem(item.id)}
                        onDelete={() => deleteGroceryItem(item.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {boughtItems.length > 0 && (
          <div className="pt-4 flex justify-center">
            <Button 
              variant="ghost" 
              onClick={clearBoughtItems} 
              className="text-muted-foreground text-xs"
              data-testid="button-clear-bought"
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
      data-testid={`grocery-item-${item.id}`}
    >
      <div 
        onClick={onToggle}
        className="flex items-center gap-3 flex-1 cursor-pointer select-none"
        data-testid={`button-toggle-item-${item.id}`}
      >
        <div className={cn("transition-colors duration-300", item.isBought ? "text-primary" : "text-muted-foreground/50")}>
          {item.isBought ? <CheckCircle2 size={24} className="fill-primary/10" /> : <Circle size={24} />}
        </div>
        <div>
          <span className={cn(
            "font-medium transition-all duration-300",
            item.isBought ? "line-through text-muted-foreground" : "text-foreground"
          )} data-testid={`text-item-name-${item.id}`}>
            {item.name}
          </span>
          {item.sourceMeal && !item.isBought && (
            <div className="text-[10px] text-muted-foreground">For: {item.sourceMeal}</div>
          )}
        </div>
      </div>
      
      <Button 
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="p-2 text-muted-foreground/30"
        data-testid={`button-delete-item-${item.id}`}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}
