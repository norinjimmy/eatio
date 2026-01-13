import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type WorkShift = 'day' | 'evening';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [workDays, setWorkDays] = useState<string[]>(() => {
    const saved = localStorage.getItem('app-work-days');
    return saved ? JSON.parse(saved) : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  });

  const [workShift, setWorkShift] = useState<WorkShift>(() => {
    const saved = localStorage.getItem('app-work-shift');
    return (saved as WorkShift) || 'day';
  });

  const [breakfastDays, setBreakfastDays] = useState<string[]>(() => {
    const saved = localStorage.getItem('app-breakfast-days');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('app-work-days', JSON.stringify(workDays));
  }, [workDays]);

  useEffect(() => {
    localStorage.setItem('app-work-shift', workShift);
  }, [workShift]);

  useEffect(() => {
    localStorage.setItem('app-breakfast-days', JSON.stringify(breakfastDays));
  }, [breakfastDays]);

  const toggleWorkDay = (day: string) => {
    setWorkDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleBreakfastDay = (day: string) => {
    setBreakfastDays(prev => 
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
                  data-testid={`switch-work-${day.toLowerCase()}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg">{t("workShift")}</CardTitle>
            <CardDescription>{t("workShiftDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={workShift} onValueChange={(v) => setWorkShift(v as WorkShift)}>
              <div className="flex items-center space-x-3 py-2">
                <RadioGroupItem value="day" id="shift-day" data-testid="radio-shift-day" />
                <Label htmlFor="shift-day" className="font-medium cursor-pointer">
                  {t("dayShift")}
                </Label>
              </div>
              <div className="flex items-center space-x-3 py-2">
                <RadioGroupItem value="evening" id="shift-evening" data-testid="radio-shift-evening" />
                <Label htmlFor="shift-evening" className="font-medium cursor-pointer">
                  {t("eveningShift")}
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg">{t("breakfastDays")}</CardTitle>
            <CardDescription>{t("breakfastDaysDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center justify-between py-2">
                <Label htmlFor={`breakfast-${day}`} className="font-medium">
                  {t(day.toLowerCase() as any)}
                </Label>
                <Switch 
                  id={`breakfast-${day}`}
                  checked={breakfastDays.includes(day)}
                  onCheckedChange={() => toggleBreakfastDay(day)}
                  data-testid={`switch-breakfast-${day.toLowerCase()}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
