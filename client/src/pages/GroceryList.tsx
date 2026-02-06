import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { useStore, GroceryItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, RefreshCw, CheckCircle2, Circle, MoreVertical, Apple, Milk, Beef, Snowflake, Croissant, Package, Coffee, Candy, HelpCircle, ArrowLeft, Edit } from "lucide-react";
import EditGroceryDialog from "@/components/EditGroceryDialog";
import DeleteByRecipeDialog from "@/components/DeleteByRecipeDialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CATEGORY_NAMES, CATEGORY_ORDER, categorizeIngredient, type GroceryCategory } from "@shared/ingredient-utils";
import { useShare } from "@/lib/share-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { format, startOfWeek } from "date-fns";

// Category icons
const CATEGORY_ICONS: Record<GroceryCategory, React.ReactNode> = {
  vegetables: <Apple size={16} />,
  dairy: <Milk size={16} />,
  meat: <Beef size={16} />,
  frozen: <Snowflake size={16} />,
  bread: <Croissant size={16} />,
  pantry: <Package size={16} />,
  beverages: <Coffee size={16} />,
  snacks: <Candy size={16} />,
  other: <HelpCircle size={16} />,
};

export default function GroceryList() {
  const { t, language } = useTranslation();
  const { addGroceryItem, toggleGroceryItem, deleteGroceryItem, clearBoughtItems, clearAllItems, regenerateGroceryList } = useStore();
  const { toast } = useToast();
  
  const [newItem, setNewItem] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GroceryItem | null>(null);
  const [deleteByRecipeOpen, setDeleteByRecipeOpen] = useState(false);

  // Fetch grocery list (now includes own + all shared items automatically)
  const { data: groceryItems = [] } = useQuery<GroceryItem[]>({
    queryKey: ['/api/grocery'],
  });

  // Mutation for editing grocery items
  const editItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<GroceryItem> }) => {
      return apiRequest('PUT', `/api/grocery/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grocery'] });
      toast({ title: language === 'sv' ? 'Vara uppdaterad' : 'Item updated' });
    },
  });

  // Mutation for deleting by source meal
  const deleteBySourceMutation = useMutation({
    mutationFn: async (sourceMeal: string) => {
      return apiRequest('DELETE', `/api/grocery/by-meal/${encodeURIComponent(sourceMeal)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grocery'] });
      toast({ title: language === 'sv' ? 'Recept borttaget' : 'Recipe removed' });
    },
  });

  const displayGroceryItems = groceryItems;
  const canEdit = true;

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newItem.trim() || !canEdit) return;
    
    addGroceryItem(newItem);
    setNewItem("");
  };

  const handleToggle = (itemId: number, currentBought: boolean) => {
    toggleGroceryItem(itemId);
  };

  const handleDelete = (itemId: number) => {
    if (!canEdit) return;
    deleteGroceryItem(itemId);
  };

  const handleRegenerate = async () => {
    if (!canEdit) return;
    regenerateGroceryList();
    
    const title = language === 'sv' ? "Lista uppdaterad" : "List Updated";
    const desc = language === 'sv' ? "Varor från veckoplan tillagda." : "Items from weekly plan added.";
    toast({ title, description: desc });
  };

  const handleClearBought = async () => {
    if (!canEdit) return;
    clearBoughtItems();
  };

  const handleClearAll = async () => {
    if (!canEdit) return;
    clearAllItems();
    
    toast({ title: t("itemsCleared") });
  };

  const handleEditItem = (item: GroceryItem) => {
    if (!canEdit) return;
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (updates: Partial<GroceryItem>) => {
    if (!selectedItem) return;
    await editItemMutation.mutateAsync({ id: selectedItem.id, updates });
    setEditDialogOpen(false);
    setSelectedItem(null);
  };

  const handleDeleteByRecipe = async (sourceMeal: string) => {
    await deleteBySourceMutation.mutateAsync(sourceMeal);
  };
  
  // Group items by category - memoized for performance
  const groupedItems = useMemo(() => {
    return CATEGORY_ORDER.reduce((acc, category) => {
      const categoryItems = displayGroceryItems.filter(item => 
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
  }, [displayGroceryItems]);
  
  // Collect bought items from all categories - memoized for performance
  const boughtItems = useMemo(() => {
    return displayGroceryItems.filter(i => i.isBought);
  }, [displayGroceryItems]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-display font-bold">
              {t("groceryList")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
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
            )}
            
            {displayGroceryItems.length > 0 && canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" data-testid="button-grocery-menu">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl bg-white">
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      setDeleteByRecipeOpen(true);
                    }}
                    className="text-sm"
                    data-testid="menu-item-delete-by-recipe"
                  >
                    <Trash2 size={14} className="mr-2" />
                    {language === 'sv' ? 'Radera per recept' : 'Delete by recipe'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      handleClearAll();
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
        {canEdit && (
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
        )}

        {displayGroceryItems.length === 0 ? (
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
                        onToggle={() => handleToggle(item.id, item.isBought)}
                        onDelete={() => handleDelete(item.id)}
                        onEdit={() => handleEditItem(item)}
                        canEdit={canEdit}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {boughtItems.length > 0 && canEdit && (
          <div className="pt-4 flex justify-center">
            <Button 
              variant="ghost" 
              onClick={handleClearBought} 
              className="text-muted-foreground text-xs"
              data-testid="button-clear-bought"
            >
              <Trash2 size={14} className="mr-2" />
              {t("clearBought")}
            </Button>
          </div>
        )}
      </div>

      <EditGroceryDialog
        item={selectedItem}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
      />

      <DeleteByRecipeDialog
        open={deleteByRecipeOpen}
        onOpenChange={setDeleteByRecipeOpen}
        items={displayGroceryItems}
        onDelete={handleDeleteByRecipe}
      />
    </Layout>
  );
}

function GroceryListItem({ item, onToggle, onDelete, onEdit, canEdit }: { item: GroceryItem, onToggle: () => void, onDelete: () => void, onEdit: () => void, canEdit: boolean }) {
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
      
      {canEdit && (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="p-2 text-muted-foreground/30 hover:text-primary"
            data-testid={`button-edit-item-${item.id}`}
          >
            <Edit size={16} />
          </Button>
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
      )}
    </div>
  );
}
