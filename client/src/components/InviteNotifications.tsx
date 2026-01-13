import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import type { MealPlanShare } from "@shared/schema";

export function InviteNotifications() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: pendingInvites = [] } = useQuery<MealPlanShare[]>({
    queryKey: ['/api/shares/pending'],
    refetchInterval: 30000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/shares/${id}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shares/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shares/received'] });
      toast({ title: t("inviteAccepted") });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/shares/${id}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shares/pending'] });
      toast({ title: t("inviteDeclined") });
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-8 w-8"
          data-testid="button-notifications"
        >
          <Bell size={18} />
          {pendingInvites.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {pendingInvites.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">{t("pendingInvites")}</h4>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {pendingInvites.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t("noShares")}
            </div>
          )}
          {pendingInvites.map((invite) => (
            <div 
              key={invite.id} 
              className="p-3 border-b last:border-b-0 flex items-center justify-between gap-2"
              data-testid={`invite-item-${invite.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {invite.ownerName || t("unknownUser")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("wantsToShare")}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => acceptMutation.mutate(invite.id)}
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                  data-testid={`button-accept-${invite.id}`}
                >
                  <Check size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => declineMutation.mutate(invite.id)}
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                  data-testid={`button-decline-${invite.id}`}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
