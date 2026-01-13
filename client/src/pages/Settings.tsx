import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Send, Trash2, Users, Eye, Edit2, Clock, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { MealPlanShare } from "@shared/schema";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type WorkShift = 'day' | 'evening';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");

  const workDays = settings?.workDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const workShift = (settings?.workShift || 'day') as WorkShift;
  const breakfastDays = settings?.breakfastDays || [];

  // Fetch shares I've created
  const { data: myShares = [] } = useQuery<MealPlanShare[]>({
    queryKey: ['/api/shares'],
  });

  // Fetch shares shared with me
  const { data: sharedWithMe = [] } = useQuery<MealPlanShare[]>({
    queryKey: ['/api/shares/received'],
  });

  // Create share mutation
  const createShareMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('POST', '/api/shares', { email, permission: 'view' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shares'] });
      setInviteEmail("");
      toast({ title: t("inviteSent") });
    },
  });

  // Revoke share mutation
  const revokeShareMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/shares/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shares'] });
    },
  });

  const handleSendInvite = () => {
    if (inviteEmail.trim()) {
      createShareMutation.mutate(inviteEmail.trim());
    }
  };

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

        <Card className="border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users size={20} />
              {t("sharing")}
            </CardTitle>
            <CardDescription>{t("sharingDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">{t("inviteFamily")}</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={t("enterEmail")}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                  data-testid="input-invite-email"
                />
                <Button 
                  onClick={handleSendInvite} 
                  disabled={!inviteEmail.trim() || createShareMutation.isPending}
                  data-testid="button-send-invite"
                >
                  <Send size={16} className="mr-1" />
                  {t("sendInvite")}
                </Button>
              </div>
            </div>

            {myShares.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("acceptedShares")}</Label>
                <div className="space-y-2">
                  {myShares.map((share) => (
                    <div 
                      key={share.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`share-item-${share.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {share.status === 'pending' ? (
                          <Clock size={16} className="text-muted-foreground" />
                        ) : (
                          <Check size={16} className="text-green-600" />
                        )}
                        <div>
                          <div className="text-sm font-medium">{share.invitedEmail}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {share.permission === 'view' ? (
                              <><Eye size={12} /> {t("viewOnly")}</>
                            ) : (
                              <><Edit2 size={12} /> {t("canEdit")}</>
                            )}
                            {share.status === 'pending' && (
                              <span className="ml-2 text-amber-600">({t("pendingInvites")})</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => revokeShareMutation.mutate(share.id)}
                        data-testid={`button-revoke-${share.id}`}
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sharedWithMe.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("sharedWithMe")}</Label>
                <div className="space-y-2">
                  {sharedWithMe.map((share) => (
                    <div 
                      key={share.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`shared-with-me-${share.id}`}
                    >
                      <div>
                        <div className="text-sm font-medium">{share.ownerName || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {share.permission === 'view' ? (
                            <><Eye size={12} /> {t("viewOnly")}</>
                          ) : (
                            <><Edit2 size={12} /> {t("canEdit")}</>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => { 
                          localStorage.setItem('viewing-shared-plan', JSON.stringify(share));
                          window.location.href = '/week';
                        }}
                        data-testid={`button-view-plan-${share.id}`}
                      >
                        {t("viewPlan")}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {myShares.length === 0 && sharedWithMe.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("noShares")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
