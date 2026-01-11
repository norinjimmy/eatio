import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { ArrowRight, Utensils, CalendarDays, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { t } = useTranslation();
  const { meals, recipes, groceryItems } = useStore();

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysMealsList = meals.filter(m => m.day === today);
  const lunch = todaysMealsList.find(m => m.type === 'lunch');
  const dinner = todaysMealsList.find(m => m.type === 'dinner');

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const plannedDaysCount = DAYS.filter(day => 
    meals.some(m => m.day === day)
  ).length;

  const totalRecipes = recipes.length;
  const itemsToBuy = groceryItems.filter(i => !i.isBought).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning");
    if (hour < 18) return t("goodAfternoon");
    return t("goodEvening");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-foreground">
            {getGreeting()}
          </h2>
          <p className="text-muted-foreground">
            {t("todaysMeals")}
          </p>
        </div>

        {/* Current Day Meals */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="border-none shadow-sm bg-card overflow-hidden">
            <CardContent className="p-0">
              <div className="flex divide-x divide-border/40">
                <div className="flex-1 p-4">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1 flex items-center gap-1">
                    <Utensils size={10} className="text-primary" /> {t("lunch")}
                  </div>
                  <div className="font-medium text-sm truncate">
                    {lunch ? lunch.name : <span className="text-muted-foreground/40 italic">Inget planerat</span>}
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1 flex items-center gap-1">
                    <Utensils size={10} className="text-primary" /> {t("dinner")}
                  </div>
                  <div className="font-medium text-sm truncate">
                    {dinner ? dinner.name : <span className="text-muted-foreground/40 italic">Inget planerat</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-none shadow-sm group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <CalendarDays size={24} />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-foreground">{plannedDaysCount}/7</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("plannedDays")}</div>
              </div>
              <div className="h-2 w-24 bg-indigo-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-500" 
                  style={{ width: `${(plannedDaysCount / 7) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/recipes" className="cursor-pointer">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-none shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Utensils size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{totalRecipes}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("totalRecipes")}</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/grocery" className="cursor-pointer">
            <Card className="bg-gradient-to-br from-secondary to-secondary/50 border-none shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-orange-200/50 flex items-center justify-center text-orange-700 group-hover:scale-110 transition-transform">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{itemsToBuy}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("itemsToBuy")}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
