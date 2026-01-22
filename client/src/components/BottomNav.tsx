import { Link, useLocation } from "wouter";
import { Home, Calendar, BookOpen, ShoppingCart, Heart, Settings } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  const tabs = [
    { path: "/", icon: Home, label: t("home") },
    { path: "/plan", icon: Calendar, label: t("weeklyPlan") },
    { path: "/recipes", icon: BookOpen, label: t("recipes") },
    { path: "/grocery", icon: ShoppingCart, label: t("groceryList") },
    { path: "/favorites", icon: Heart, label: t("favorites") },
    { path: "/settings", icon: Settings, label: t("settings") },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-border/50 z-50 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0rem)' }}
    >
      <nav className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location === tab.path;
          return (
            <Link key={tab.path} href={tab.path} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center justify-center h-full space-y-1 cursor-pointer transition-all duration-200",
                  isActive 
                    ? "text-primary scale-110 font-medium" 
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
              >
                <tab.icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn("transition-colors", isActive && "fill-primary/10")}
                />
                <span className="text-[10px] sm:text-xs truncate max-w-[64px]">
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
