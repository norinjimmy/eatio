import Layout from "@/components/Layout";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Send, Trash2, Users, Eye, Edit2, Clock, Check, Briefcase, UserCircle, AlertTriangle, UserPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useShare } from "@/lib/share-context";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { MealPlanShare } from "@shared/schema";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type WorkShift = 'day' | 'evening';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useStore();
  const { setViewingShare } = useShare();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState<'view' | 'edit'>('view');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const workDays = settings?.workDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const workShift = (settings?.workShift || 'day') as WorkShift;
  const breakfastDays = settings?.breakfastDays || [];

  const { data: myShares = [] } = useQuery<MealPlanShare[]>({
    queryKey: ['/api/shares'],
  });

  const { data: sharedWithMe = [] } = useQuery<MealPlanShare[]>({
    queryKey: ['/api/shares/received'],
  });

  const createShareMutation = useMutation({
    mutationFn: async ({ email, permission }: { email: string; permission: 'view' | 'edit' }) => {
      return apiRequest('POST', '/api/shares', { email, permission });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shares'] });
      setInviteEmail("");
      setInvitePermission('view');
      toast({ title: t("inviteSent") });
    },
  });

  const revokeShareMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/shares/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shares'] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/account');
    },
    onSuccess: () => {
      toast({ title: t("accountDeleted") });
      window.location.href = '/api/logout';
    },
  });

  const handleSendInvite = () => {
    if (inviteEmail.trim()) {
      createShareMutation.mutate({ email: inviteEmail.trim(), permission: invitePermission });
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
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold">{t("settings")}</h2>
      </div>

      <div className="space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={20} className="text-primary" />
            <h3 className="text-lg font-bold">{t("workSchedule")}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("workScheduleDesc")}</p>
          
          <div className="space-y-4">
            <Card className="border-none shadow-sm bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("workDays")}</CardTitle>
                <CardDescription className="text-xs">{t("workDaysDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center justify-between py-1.5">
                    <Label htmlFor={`day-${day}`} className="font-medium text-sm">
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
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("workShift")}</CardTitle>
                <CardDescription className="text-xs">{t("workShiftDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={workShift} onValueChange={(v) => handleShiftChange(v as WorkShift)}>
                  <div className="flex items-center space-x-3 py-1.5">
                    <RadioGroupItem value="day" id="shift-day" data-testid="radio-shift-day" />
                    <Label htmlFor="shift-day" className="font-medium text-sm cursor-pointer">
                      {t("dayShift")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 py-1.5">
                    <RadioGroupItem value="evening" id="shift-evening" data-testid="radio-shift-evening" />
                    <Label htmlFor="shift-evening" className="font-medium text-sm cursor-pointer">
                      {t("eveningShift")}
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("breakfastDays")}</CardTitle>
                <CardDescription className="text-xs">{t("breakfastDaysDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center justify-between py-1.5">
                    <Label htmlFor={`breakfast-${day}`} className="font-medium text-sm">
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
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-primary" />
            <h3 className="text-lg font-bold">{t("sharing") || "Delning"}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t("sharingDesc") || "Bjud in familjemedlemmar att se din veckoplan"}
          </p>

          <Card className="border-none shadow-sm bg-card">
            <CardContent className="pt-6 space-y-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("inviteFamily")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={t("enterEmail")}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                    className="flex-1"
                    data-testid="input-invite-email"
                  />
                  <Select value={invitePermission} onValueChange={(v) => setInvitePermission(v as 'view' | 'edit')}>
                    <SelectTrigger className="w-[140px]" data-testid="select-permission">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view" data-testid="option-view">
                        <span className="flex items-center gap-1.5">
                          <Eye size={14} />
                          {t("viewOnly")}
                        </span>
                      </SelectItem>
                      <SelectItem value="edit" data-testid="option-edit">
                        <span className="flex items-center gap-1.5">
                          <Edit2 size={14} />
                          {t("canEdit")}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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

              {/* Hidden: "Delat med mig" section - all data is now automatically merged */}
              {false && sharedWithMe.length > 0 && (
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
                            setViewingShare(share);
                            navigate('/plan');
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
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <UserCircle size={20} className="text-primary" />
            <h3 className="text-lg font-bold">{t("account")}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("accountDesc")}</p>

          {user && (
            <Card className="border-none shadow-sm bg-card mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {user.profileImageUrl && (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    {user.email && (
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("logout")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm bg-card border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-destructive">{t("deleteAccount")}</div>
                  <div className="text-sm text-muted-foreground">{t("deleteAccountDesc")}</div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  data-testid="button-delete-account"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("delete")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-2xl w-[90%] max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={20} />
              <DialogTitle>{t("deleteAccount")}</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              {t("confirmDeleteAccount")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-4">
            <Button 
              variant="destructive"
              onClick={() => deleteAccountMutation.mutate()}
              disabled={deleteAccountMutation.isPending}
              data-testid="button-confirm-delete-account"
            >
              {t("delete")}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              data-testid="button-cancel-delete-account"
            >
              {t("cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
