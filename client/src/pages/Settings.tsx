import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SettingsPage() {
  const { t } = useTranslation();
  const [workDays, setWorkDays] = useState<string[]>(() => {
    const saved = localStorage.getItem('app-work-days');
    return saved ? JSON.parse(saved) : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  });

  useEffect(() => {
    localStorage.setItem('app-work-days', JSON.stringify(workDays));
  }, [workDays]);

  const toggleWorkDay = (day: string) => {
    setWorkDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold">{t("settings")}</h2>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg">{t("workDays")}</CardTitle>
            <CardDescription>{t("workDaysDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center justify-between py-2">
                <Label htmlFor={`day-${day}`} className="font-medium">
                  {t(day.toLowerCase() as any)}
                </Label>
                <Switch 
                  id={`day-${day}`}
                  checked={workDays.includes(day)}
                  onCheckedChange={() => toggleWorkDay(day)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
