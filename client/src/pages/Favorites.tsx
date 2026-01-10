import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { useStore, Recipe } from "@/lib/store";
import { Heart, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Favorites() {
  const { t } = useTranslation();
  const { recipes, toggleFavorite } = useStore();

  const favoriteRecipes = recipes.filter(r => r.isFavorite);

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold">{t("favorites")}</h2>

        {favoriteRecipes.length === 0 ? (
          <div className="text-center py-12 opacity-50">
            <Heart className="mx-auto h-12 w-12 mb-3 text-muted-foreground" />
            <p>No favorites yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favoriteRecipes.map(recipe => (
              <FavoriteCard 
                key={recipe.id} 
                recipe={recipe} 
                onToggleFav={() => toggleFavorite(recipe.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function FavoriteCard({ recipe, onToggleFav }: { recipe: Recipe; onToggleFav: () => void }) {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <ChefHat size={20} />
        </div>
        <div>
           <h3 className="font-bold text-foreground">{recipe.name}</h3>
           <p className="text-xs text-muted-foreground">Used {recipe.usageCount} times</p>
        </div>
      </div>
      <button 
        onClick={onToggleFav}
        className="p-2 text-red-500 hover:scale-110 transition-transform"
      >
        <Heart size={24} className="fill-current" />
      </button>
    </div>
  );
}
