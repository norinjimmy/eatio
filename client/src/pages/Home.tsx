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
  // Map JS Date weekday to our simple string days if possible, or just default to Monday for demo
  // In a real app we'd map this properly. Let's assume user manages "Monday" manually.
  
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

        {/* Quick Stats Grid */}
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

        {/* CTA Card */}
        <Card className="overflow-hidden border-2 border-accent/50 shadow-lg">
          <CardHeader className="bg-accent/30 pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="text-indigo-500" />
              {t("weeklyPlan")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <p className="text-sm text-muted-foreground mb-4">
              Plan your meals ahead to save time and eat healthier.
            </p>
            <Link href="/plan">
              <button className="w-full py-3 bg-foreground text-background rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors">
                {t("weeklyPlan")} <ArrowRight size={16} />
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
