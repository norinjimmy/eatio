import { ReactNode, useEffect, useRef, useState } from "react";
import BottomNav from "./BottomNav";
import { useTranslation } from "@/lib/i18n";
import { Button } from "./ui/button";
import { InviteNotifications } from "./InviteNotifications";
import { RefreshCw } from "lucide-react";
import eatioLogo from "@assets/the-one-on-the-top-left-with-the-fork-an_ikM_tG1FQlKT7lm80e_N_1768160135743.jpeg";

interface LayoutProps {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
}

export default function Layout({ children, onRefresh }: LayoutProps) {
  const { language, setLanguage } = useTranslation();
  const mainRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef<number>(0);
  const isPulling = useRef(false);
  const PULL_THRESHOLD = 80;

  const toggleLang = () => {
    setLanguage(language === 'sv' ? 'en' : 'sv');
  };

  // Pull-to-refresh implementation
  useEffect(() => {
    if (!onRefresh) return;
    
    const main = mainRef.current;
    if (!main) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (main.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;

      const touchY = e.touches[0].clientY;
      const pullDist = Math.max(0, touchY - touchStartY.current);
      
      if (main.scrollTop === 0 && pullDist > 0) {
        setPullDistance(Math.min(pullDist, PULL_THRESHOLD * 1.5));
        
        if (pullDist > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current || isRefreshing) return;

      isPulling.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 500);
        }
      } else {
        setPullDistance(0);
      }
    };

    main.addEventListener('touchstart', handleTouchStart, { passive: true });
    main.addEventListener('touchmove', handleTouchMove, { passive: false });
    main.addEventListener('touchend', handleTouchEnd);

    return () => {
      main.removeEventListener('touchstart', handleTouchStart);
      main.removeEventListener('touchmove', handleTouchMove);
      main.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, isRefreshing, pullDistance]);

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
      
      {/* Pull-to-refresh indicator */}
      {onRefresh && (pullDistance > 0 || isRefreshing) && (
        <div 
          className="flex justify-center items-center py-2 transition-all duration-200"
          style={{ 
            height: `${Math.min(pullDistance, PULL_THRESHOLD)}px`,
            opacity: Math.min(pullDistance / PULL_THRESHOLD, 1)
          }}
        >
          <RefreshCw 
            size={20} 
            className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${pullDistance * 2}deg)`
            }}
          />
        </div>
      )}
      
      {/* Main content - extra padding bottom for bottom nav + safe area */}
      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full px-3 py-3 pb-28">
        <div className="max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
