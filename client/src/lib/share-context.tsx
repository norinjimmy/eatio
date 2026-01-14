import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { MealPlanShare } from '@shared/schema';

interface ShareContextType {
  viewingShare: MealPlanShare | null;
  canEdit: boolean;
  setViewingShare: (share: MealPlanShare | null) => void;
  exitShareView: () => void;
}

const ShareContext = createContext<ShareContextType | undefined>(undefined);

export function ShareProvider({ children }: { children: ReactNode }) {
  const [viewingShare, setViewingShareState] = useState<MealPlanShare | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('viewing-shared-plan');
    if (stored) {
      try {
        setViewingShareState(JSON.parse(stored));
      } catch {
        localStorage.removeItem('viewing-shared-plan');
      }
    }
  }, []);

  const setViewingShare = useCallback((share: MealPlanShare | null) => {
    if (share) {
      localStorage.setItem('viewing-shared-plan', JSON.stringify(share));
    } else {
      localStorage.removeItem('viewing-shared-plan');
    }
    setViewingShareState(share);
  }, []);

  const exitShareView = useCallback(() => {
    localStorage.removeItem('viewing-shared-plan');
    setViewingShareState(null);
  }, []);

  const canEdit = viewingShare?.permission === 'edit';

  return (
    <ShareContext.Provider value={{ viewingShare, canEdit, setViewingShare, exitShareView }}>
      {children}
    </ShareContext.Provider>
  );
}

export function useShare() {
  const context = useContext(ShareContext);
  if (!context) {
    throw new Error('useShare must be used within a ShareProvider');
  }
  return context;
}
