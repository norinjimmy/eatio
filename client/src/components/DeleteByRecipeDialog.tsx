import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GroceryItem } from "@/lib/store";
import { Trash2 } from "lucide-react";

interface DeleteByRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: GroceryItem[];
  onDelete: (sourceMeal: string) => void;
}

export function DeleteByRecipeDialog({ open, onOpenChange, items, onDelete }: DeleteByRecipeDialogProps) {
  // Group items by source meal - split on periods to get unique recipe names
  const grouped = items.reduce((acc, item) => {
    if (!item.sourceMeal) return acc;
    // Split on period and take first recipe name only
    const recipeName = item.sourceMeal.split('.')[0].trim();
    if (!acc[recipeName]) {
      acc[recipeName] = [];
    }
    acc[recipeName].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  const sources = Object.keys(grouped).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Radera per recept</DialogTitle>
          <DialogDescription>
            Välj ett recept för att radera alla dess ingredienser från listan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Inga ingredienser från recept
            </p>
          ) : (
            sources.map((source) => {
              const sourceItems = grouped[source];
              return (
                <div key={source} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{source}</h4>
                      <p className="text-xs text-muted-foreground">
                        {sourceItems.length} ingrediens{sourceItems.length !== 1 ? 'er' : ''}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        onDelete(source);
                        onOpenChange(false);
                      }}
                      className="flex-shrink-0"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Radera
                    </Button>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    {sourceItems.slice(0, 3).map((item) => (
                      <p key={item.id} className="text-xs text-muted-foreground pl-2">
                        • {item.name}
                      </p>
                    ))}
                    {sourceItems.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-2">
                        ... och {sourceItems.length - 3} till
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteByRecipeDialog;
