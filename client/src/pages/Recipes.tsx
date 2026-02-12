import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { useStore, Recipe } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Heart, Search, Plus, ChefHat, Trash2, Edit2, ExternalLink, Download, Loader2, Camera, Upload, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useShare } from "@/lib/share-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function Recipes() {
  const { t } = useTranslation();
  const { recipes, addRecipe, deleteRecipe, toggleFavorite } = useStore();
  const { toast } = useToast();
  const { viewingShare, setViewingShare } = useShare();
  
  // Fetch shared recipes if viewing someone else's plan
  const { data: sharedRecipes = [], refetch: refetchSharedRecipes } = useQuery<Recipe[]>({
    queryKey: ['/api/shares', viewingShare?.id, 'recipes'],
    queryFn: async () => {
      if (!viewingShare) return [];
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`/api/shares/${viewingShare.id}/recipes`, { headers });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!viewingShare,
  });
  
  const displayRecipes = viewingShare ? sharedRecipes : recipes;
  const canEdit = !viewingShare; // Can only edit own recipes
  
  // Pull-to-refresh handler
  const handleRefresh = async () => {
    if (viewingShare) {
      await refetchSharedRecipes();
    } else {
      await queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
    }
  };
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const filteredRecipes = displayRecipes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFetchFromUrl = async () => {
    if (!url) {
      toast({ title: t("enterUrl"), variant: "destructive" });
      return;
    }
    
    setIsFetching(true);
    try {
      const response = await apiRequest('POST', '/api/scrape-recipe', { url });
      const data = await response.json() as { name?: string; ingredients: string[]; instructions?: string };
      
      if (data.name) setName(data.name);
      if (data.ingredients.length > 0) setIngredients(data.ingredients.join('\n'));
      if (data.instructions) setInstructions(data.instructions);
      
      toast({ 
        title: t("fetchSuccess"), 
        description: `${data.ingredients.length} ${t("ingredientsFound")}` 
      });
    } catch (err) {
      toast({ 
        title: t("fetchFailed"), 
        description: t("couldNotFetchRecipe"),
        variant: "destructive" 
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handlePhotoScan = async (file: File) => {
    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        try {
          const response = await apiRequest('POST', '/api/scan-recipe', { image: base64 });
          const data = await response.json() as { name?: string; ingredients: string[]; instructions?: string };
          
          if (data.name) setName(data.name);
          if (data.ingredients && data.ingredients.length > 0) setIngredients(data.ingredients.join('\n'));
          if (data.instructions) setInstructions(data.instructions);
          
          toast({ 
            title: t("scanSuccess"), 
            description: `${data.ingredients?.length || 0} ${t("ingredientsFound")}` 
          });
        } catch (err) {
          toast({ 
            title: t("scanFailed"), 
            description: t("couldNotScanRecipe"),
            variant: "destructive" 
          });
        } finally {
          setIsScanning(false);
        }
      };
      reader.onerror = () => {
        toast({ 
          title: t("scanFailed"), 
          description: t("couldNotScanRecipe"),
          variant: "destructive" 
        });
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast({ 
        title: t("scanFailed"), 
        description: t("couldNotScanRecipe"),
        variant: "destructive" 
      });
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoScan(file);
    }
  };

  const handleCreate = () => {
    if (!name) return;
    addRecipe({
      name,
      url,
      ingredients: ingredients.split('\n').filter(i => i.trim()),
      instructions
    });
    setName("");
    setUrl("");
    setIngredients("");
    setInstructions("");
    setIsCreateOpen(false);
    toast({ title: "Recipe Created", description: `${name} has been added.` });
  };

  return (
    <Layout onRefresh={handleRefresh}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          {viewingShare && (
            <Button
              variant="ghost"
              onClick={() => setViewingShare(null)}
              className="w-fit -ml-2"
            >
              <ArrowLeft size={16} className="mr-2" />
              {t("backToMyPlan")}
            </Button>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold">{t("recipes")}</h2>
              {viewingShare && (
                <p className="text-sm text-muted-foreground mt-1">
                  {viewingShare.ownerName}'s {t("recipes").toLowerCase()}
                </p>
              )}
            </div>
            {canEdit && (
              <Button onClick={() => setIsCreateOpen(true)} className="rounded-full bg-primary hover:bg-primary/90 shadow-md">
                <Plus size={18} className="mr-1" /> {t("add")}
              </Button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder={t("searchPlaceholder")} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-card border-none shadow-sm h-11"
            />
          </div>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12 opacity-50">
            <ChefHat className="mx-auto h-12 w-12 mb-3" />
            <p>{t("noRecipes")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRecipes.map(recipe => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                onToggleFav={canEdit ? () => toggleFavorite(recipe.id) : undefined}
                onDelete={canEdit ? () => deleteRecipe(recipe.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-2xl w-[95%] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("createRecipe")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Photo scan buttons */}
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-camera"
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isScanning}
                className="rounded-xl flex-1"
                data-testid="button-take-photo"
              >
                {isScanning ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
                <span className="ml-1.5">{isScanning ? t("scanning") : t("takePhoto")}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="rounded-xl flex-1"
                data-testid="button-upload-photo"
              >
                {isScanning ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                <span className="ml-1.5">{isScanning ? t("scanning") : t("uploadPhoto")}</span>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("recipeName")}</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
                placeholder="e.g. Pasta Carbonara"
                data-testid="input-recipe-name"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("recipeUrl")}</Label>
              <div className="flex gap-2">
                <Input 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)}
                  className="rounded-xl flex-1"
                  placeholder="https://..."
                  data-testid="input-recipe-url"
                />
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleFetchFromUrl}
                  disabled={isFetching || !url}
                  className="rounded-xl shrink-0"
                  data-testid="button-fetch-recipe"
                >
                  {isFetching ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  <span className="ml-1.5">{t("fetch")}</span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("ingredients")}</Label>
              <Textarea 
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="rounded-xl min-h-[100px]"
                placeholder="Pasta&#10;Egg&#10;Bacon"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("instructions")}</Label>
              <Textarea 
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="rounded-xl min-h-[100px]"
                placeholder="Boil pasta..."
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">{t("cancel")}</Button>
            <Button onClick={handleCreate} className="rounded-xl bg-primary text-primary-foreground">{t("save")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function RecipeCard({ recipe, onToggleFav, onDelete }: { recipe: Recipe; onToggleFav?: () => void; onDelete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="p-4 flex items-start justify-between">
        <div onClick={() => setIsOpen(!isOpen)} className="flex-1 cursor-pointer">
          <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{recipe.name}</h3>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{recipe.ingredients.length} ingredients</p>
            {recipe.url && (
              <a 
                href={recipe.url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink size={12} />
                Link
              </a>
            )}
          </div>
        </div>
        {onToggleFav && (
          <button 
            onClick={onToggleFav}
            className="p-2 -mr-2 -mt-2 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Heart 
              size={20} 
              className={cn("transition-all", recipe.isFavorite ? "fill-red-500 text-red-500" : "")} 
            />
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50 mt-2 bg-muted/10 animate-in slide-in-from-top-2 duration-200">
          <div className="mt-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Ingredients</h4>
            <ul className="text-sm list-disc pl-4 space-y-0.5 text-foreground/80">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </div>
          {recipe.instructions && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Instructions</h4>
              <p className="text-sm text-foreground/80 whitespace-pre-line">{recipe.instructions}</p>
            </div>
          )}
          
          {onDelete && (
            <div className="mt-4 flex justify-end">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="h-8 px-3 text-xs rounded-lg"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
