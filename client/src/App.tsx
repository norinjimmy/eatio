import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";

import Home from "@/pages/Home";
import WeeklyPlan from "@/pages/WeeklyPlan";
import Recipes from "@/pages/Recipes";
import GroceryList from "@/pages/GroceryList";
import Favorites from "@/pages/Favorites";
import SettingsPage from "@/pages/Settings";
import LandingPage from "@/pages/Landing";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function AuthenticatedRouter() {
  return (
    <StoreProvider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/plan" component={WeeklyPlan} />
        <Route path="/recipes" component={Recipes} />
        <Route path="/grocery" component={GroceryList} />
        <Route path="/favorites" component={Favorites} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </StoreProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
