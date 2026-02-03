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
import { LogOut, Send, Trash2, Users, Eye, Edit2, Clock, Check, Briefcase, UserCircle, AlertTriangle, Link2, Unlink, UserPlus } from "lucide-react";
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

interface LinkStatus {
  isLinked: boolean;
  isPrimary: boolean;
  linkedTo?: {
    id: string;
    email: string;
  };
  linkedUsers?: Array<{
    id: string;
    email: string;
  }>;
}

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
  const [linkEmail, setLinkEmail] = useState("");
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const workDays = settings?.workDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const workShift = (settings?.workShift || 'day') as WorkShift;
  const breakfastDays = settings?.breakfastDays || [];

  const { data: myShares = [] } = useQuery<MealPlanShare[]>({
    queryKey: ['/api/shares'],
  });

  const { data: sharedWithMe = [] } = useQuery<MealPlanShare[]>({
    queryKey: ['/api/shares/received'],
  });

  const { data: linkStatus } = useQuery<LinkStatus>({
    queryKey: ['/api/account/link-status'],
    queryFn: async () => {
      return apiRequest('GET', '/api/account/link-status');
    },
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

  const createLinkMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('POST', '/api/account/link', { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account/link-status'] });
      toast({ title: t('accountLinked') || 'Account linked!' });
      setLinkEmail("");
    },
    onError: (error: any) => {
      toast({ title: error.message, variant: 'destructive' });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/account/link/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account/link-status'] });
      toast({ title: t('accountUnlinked') || 'Account unlinked' });
    },
  });

  const splitMutation = useMutation({
    mutationFn: async (userId: string) => {
      const splitDate = new Date().toISOString().split('T')[0];
      return apiRequest('POST', `/api/account/split/${userId}`, { splitDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account/link-status'] });
      toast({ title: t('accountsSplit') || 'Accounts split' });
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

  const handleLink = () => {
    if (!linkEmail.trim()) return;
    createLinkMutation.mutate(linkEmail);
  };

  const handleUnlink = () => {
    if (!selectedUserId) return;
    unlinkMutation.mutate(selectedUserId);
    setUnlinkDialogOpen(false);
    setSelectedUserId(null);
  };

  const handleSplit = () => {
    if (!selectedUserId) return;
    splitMutation.mutate(selectedUserId);
    setSplitDialogOpen(false);
    setSelectedUserId(null);
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
            <Link2 size={20} className="text-primary" />
            <h3 className="text-lg font-bold">{t('linkedAccount') || 'Linked Account'}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t('linkedAccountDesc') || 'Link your account with another person for full collaboration'}
          </p>

          <Card className="border-none shadow-sm bg-card">
            <CardContent className="pt-6 space-y-4">
              {linkStatus?.isLinked ? (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Link2 className="text-primary mt-0.5" size={18} />
                      <div className="flex-1">
                        {linkStatus.isPrimary ? (
                          <>
                            <p className="font-medium text-sm mb-2">
                              {t('sharingWith') || 'Sharing with:'}
                            </p>
                            <div className="space-y-2">
                              {linkStatus.linkedUsers?.map(user => (
                                <div key={user.id} className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                                  <span className="text-sm">{user.email}</span>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedUserId(user.id);
                                        setSplitDialogOpen(true);
                                      }}
                                      className="h-8 text-xs"
                                      data-testid="button-split"
                                    >
                                      <Trash2 size={14} className="mr-1" />
                                      {t('split') || 'Split'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedUserId(user.id);
                                        setUnlinkDialogOpen(true);
                                      }}
                                      className="h-8 text-xs"
                                      data-testid="button-unlink"
                                    >
                                      <Unlink size={14} className="mr-1" />
                                      {t('unlink') || 'Unlink'}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-sm">
                              {t('linkedTo') || 'Linked to:'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {linkStatus.linkedTo?.email}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {t('linkedAccountInfo') || 'You are using data from the linked account. Contact the owner to unlink.'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>✓ {t('sharedDataInfo1') || 'You share all recipes, meal plans and grocery lists'}</p>
                    <p>✓ {t('sharedDataInfo2') || 'Both can add, edit and delete items'}</p>
                    <p>✓ {t('sharedDataInfo3') || 'Login is separate for each person'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t('linkAccountInfo') || 'Link your account with another person to share recipes, meal plans and grocery lists.'}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={linkEmail}
                      onChange={(e) => setLinkEmail(e.target.value)}
                      placeholder="partner@email.com"
                      className="flex-1"
                      data-testid="input-link-email"
                    />
                    <Button
                      onClick={handleLink}
                      disabled={!linkEmail.trim() || createLinkMutation.isPending}
                      data-testid="button-link"
                    >
                      <UserPlus size={16} className="mr-2" />
                      {t('link') || 'Link'}
                    </Button>
                  </div>
                  <div className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="text-muted-foreground mt-0.5" size={16} />
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>{t('linkWarning1') || 'The person must have an account and be logged in at least once.'}</p>
                        <p>{t('linkWarning2') || 'When you link, the other person will see and be able to edit all your data.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-primary" />
            <h3 className="text-lg font-bold">{t("sharing")}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("sharingDesc")}</p>

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

      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('unlink') || 'Unlink account?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('unlinkWarning') || 'The person will no longer have access to your data. Their account will be empty.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink} className="rounded-xl">
              {t('unlink') || 'Unlink'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('split') || 'Split accounts?'}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t('splitWarning') || 'All data (recipes, meal plans, grocery lists and settings) will be copied to the other person\'s account.'}
              </p>
              <p className="font-medium">
                {t('splitInfo') || 'After splitting, accounts are separate and no data is shared.'}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSplit} className="rounded-xl bg-destructive hover:bg-destructive/90">
              {t('split') || 'Split'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
