import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import { useTranslation } from "@/lib/i18n";
import { Button } from "./ui/button";
import { InviteNotifications } from "./InviteNotifications";
import eatioLogo from "@assets/the-one-on-the-top-left-with-the-fork-an_ikM_tG1FQlKT7lm80e_N_1768160135743.jpeg";

export default function Layout({ children }: { children: ReactNode }) {
  const { language, setLanguage } = useTranslation();

  const toggleLang = () => {
    setLanguage(language === 'sv' ? 'en' : 'sv');
  };

  return (
    <div className="flex flex-col h-screen max-w-full overflow-hidden bg-background text-foreground">
      {/* Status bar spacer - 32px for Android status bar */}
      <div className="h-8 bg-background flex-shrink-0" />
      
      {/* Top Bar for Mobile - Sticky under status bar */}
      <header 
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-2 flex items-center justify-between flex-shrink-0"
      >
        <div className="flex items-center gap-2">
          <img src={eatioLogo} alt="Eatio" className="w-7 h-7 rounded-lg object-cover" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Eatio
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <InviteNotifications />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLang}
            className="text-xs font-semibold rounded-full px-2.5 h-7 bg-secondary text-secondary-foreground active:scale-95"
          >
            {language === 'sv' ? '🇸🇪' : '🇬🇧'}
          </Button>
        </div>
      </header>
      
      {/* Main content - extra padding bottom for bottom nav + safe area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full px-3 py-3 pb-28">
        <div className="max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
