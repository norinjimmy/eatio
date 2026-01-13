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
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Top Bar for Mobile */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={eatioLogo} alt="Eatio Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
          <h1 className="text-xl font-bold font-display bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Eatio
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <InviteNotifications />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLang}
            className="text-xs font-semibold rounded-full px-3 h-8 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            {language === 'sv' ? '🇸🇪 SV' : '🇬🇧 EN'}
          </Button>
        </div>
      </header>
      
      <main className="max-w-md mx-auto px-4 py-4 sm:max-w-2xl lg:max-w-4xl animate-in fade-in duration-500">
        {children}
      </main>
      
      <BottomNav />
    </div>
  );
}
