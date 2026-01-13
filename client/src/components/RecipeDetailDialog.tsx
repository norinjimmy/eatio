import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/store";

interface RecipeDetailDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleFavorite?: () => void;
}

export function RecipeDetailDialog({ recipe, open, onOpenChange, onToggleFavorite }: RecipeDetailDialogProps) {
  const { t } = useTranslation();

  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl w-[95%] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-xl font-bold pr-8">{recipe.name}</DialogTitle>
            {onToggleFavorite && (
              <button 
                onClick={onToggleFavorite}
                className="p-2 -mr-2 -mt-2 text-muted-foreground hover:text-red-500 transition-colors"
                data-testid="button-toggle-favorite"
              >
                <Heart 
                  size={20} 
                  className={cn("transition-all", recipe.isFavorite ? "fill-red-500 text-red-500" : "")} 
                />
              </button>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {recipe.url && (
            <a 
              href={recipe.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              data-testid="link-recipe-url"
            >
              <ExternalLink size={14} />
              {t("viewOriginalRecipe")}
            </a>
          )}

          {recipe.ingredients.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t("ingredients")}</h4>
              <ul className="text-sm list-disc pl-4 space-y-1 text-foreground/80">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>
          )}

          {recipe.instructions && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t("instructions")}</h4>
              <p className="text-sm text-foreground/80 whitespace-pre-line">{recipe.instructions}</p>
            </div>
          )}

          {!recipe.ingredients.length && !recipe.instructions && !recipe.url && (
            <p className="text-sm text-muted-foreground italic">{t("noRecipeDetails")}</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            {t("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
