import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import { useTranslation } from "@/lib/i18n";
import { Button } from "./ui/button";

export default function Layout({ children }: { children: ReactNode }) {
  const { language, setLanguage } = useTranslation();

  const toggleLang = () => {
    setLanguage(language === 'sv' ? 'en' : 'sv');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Top Bar for Mobile */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold font-display bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          MealPlanner
        </h1>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleLang}
          className="text-xs font-semibold rounded-full px-3 h-8 bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          {language === 'sv' ? '🇸🇪 SV' : '🇬🇧 EN'}
        </Button>
      </header>
      
      <main className="max-w-md mx-auto px-4 py-4 sm:max-w-2xl lg:max-w-4xl animate-in fade-in duration-500">
        {children}
      </main>
      
      <BottomNav />
    </div>
  );
}
