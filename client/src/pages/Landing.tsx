import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, Calendar, ShoppingCart, BookOpen } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Calendar,
      title: t('weeklyPlan'),
      description: t('planMealsDesc')
    },
    {
      icon: BookOpen,
      title: t('recipes'),
      description: t('manageRecipesDesc')
    },
    {
      icon: ShoppingCart,
      title: t('groceryList'),
      description: t('groceryListDesc')
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
          <div className="flex items-center gap-3 mb-4">
            <UtensilsCrossed className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Eatio</h1>
          </div>
          
          <p className="text-xl text-muted-foreground text-center max-w-md">
            {t('welcomeMessage')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-3xl">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6 flex flex-col items-center gap-3">
                  <feature.icon className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <Button
              size="lg"
              className="text-lg px-8"
              onClick={() => { window.location.href = '/login'; }}
              data-testid="button-login"
            >
              {t('login')}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t('loginHint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
