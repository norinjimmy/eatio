import { useState } from "react";
import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight, Coffee, Utensils } from "lucide-react";
import type { Meal } from "@/lib/store";

interface WeekHistory {
  id: number;
  userId: string;
  weekStart: string;
  meals: Meal[];
  createdAt: string;
}

export default function History() {
  const { t } = useTranslation();
  const [selectedWeek, setSelectedWeek] = useState<WeekHistory | null>(null);

  const { data: history = [], isLoading } = useQuery<WeekHistory[]>({
    queryKey: ['/api/week-history'],
  });

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const formatWeekDate = (weekStart: string) => {
    const date = new Date(weekStart);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMealsForDay = (meals: Meal[], day: string) => ({
    breakfast: meals.filter(m => m.day === day && m.type === "Breakfast"),
    lunch: meals.filter(m => m.day === day && m.type === "Lunch"),
    dinner: meals.filter(m => m.day === day && m.type === "Dinner"),
  });

  if (selectedWeek) {
    return (
      <Layout>
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedWeek(null)}
            className="mb-2"
            data-testid="button-back-to-history"
          >
            &larr; {t("backToHistory")}
          </Button>
          <h2 className="text-2xl font-display font-bold">
            {t("weekOf")} {formatWeekDate(selectedWeek.weekStart)}
          </h2>
        </div>

        <div className="space-y-4 pb-8">
          {DAYS.map((day) => {
            const dayMeals = getMealsForDay(selectedWeek.meals, day);
            const hasMeals = dayMeals.breakfast.length > 0 || dayMeals.lunch.length > 0 || dayMeals.dinner.length > 0;
            
            if (!hasMeals) return null;
            
            return (
              <Card key={day}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">{t(day.toLowerCase() as any)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-3">
                  {dayMeals.breakfast.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Coffee size={14} className="text-muted-foreground" />
                      <span className="text-muted-foreground">{t("breakfast")}:</span>
                      <span>{dayMeals.breakfast.map(m => m.name).join(", ")}</span>
                    </div>
                  )}
                  {dayMeals.lunch.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Coffee size={14} className="text-muted-foreground" />
                      <span className="text-muted-foreground">{t("lunch")}:</span>
                      <span>{dayMeals.lunch.map(m => m.name).join(", ")}</span>
                    </div>
                  )}
                  {dayMeals.dinner.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Utensils size={14} className="text-muted-foreground" />
                      <span className="text-muted-foreground">{t("dinner")}:</span>
                      <span>{dayMeals.dinner.map(m => m.name).join(", ")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold">{t("mealHistory")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("mealHistoryDesc")}</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t("loading")}...
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t("noHistory")}</p>
          <p className="text-sm text-muted-foreground/70 mt-1">{t("noHistoryDesc")}</p>
        </div>
      ) : (
        <div className="space-y-3 pb-8">
          {history.map((week) => (
            <Card 
              key={week.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedWeek(week)}
              data-testid={`history-week-${week.weekStart}`}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium">{t("weekOf")} {formatWeekDate(week.weekStart)}</div>
                  <div className="text-sm text-muted-foreground">
                    {week.meals.length} {t("mealsPlanned")}
                  </div>
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
