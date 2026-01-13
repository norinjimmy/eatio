import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type WorkShift = 'day' | 'evening';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useStore();
  const { user } = useAuth();

  const workDays = settings?.workDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const workShift = (settings?.workShift || 'day') as WorkShift;
  const breakfastDays = settings?.breakfastDays || [];

  const toggleWorkDay = async (day: string) => {
    const newWorkDays = workDays.includes(day) 
      ? workDays.filter(d => d !== day) 
      : [...workDays, day];
    await updateSettings({ workDays: newWorkDays });
  };

  const toggleBreakfastDay = async (day: string) => {
    const newBreakfastDays = breakfastDays.includes(day) 
      ? breakfastDays.filter(d => d !== day) 
      : [...breakfastDays, day];
    await updateSettings({ breakfastDays: newBreakfastDays });
  };

  const handleShiftChange = async (shift: WorkShift) => {
    await updateSettings({ workShift: shift });
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">{t("settings")}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { window.location.href = '/api/logout'; }}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("logout")}
        </Button>
      </div>

      {user && (
        <Card className="border-none shadow-sm bg-card mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {user.profileImageUrl && (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <div className="font-medium">
                  {user.firstName} {user.lastName}
                </div>
                {user.email && (
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <RadioGroup value={workShift} onValueChange={(v) => handleShiftChange(v as WorkShift)}>
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
