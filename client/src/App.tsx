import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";

import Home from "@/pages/Home";
import WeeklyPlan from "@/pages/WeeklyPlan";
import Recipes from "@/pages/Recipes";
import GroceryList from "@/pages/GroceryList";
import Favorites from "@/pages/Favorites";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/plan" component={WeeklyPlan} />
      <Route path="/recipes" component={Recipes} />
      <Route path="/grocery" component={GroceryList} />
      <Route path="/favorites" component={Favorites} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <LanguageProvider>
      <StoreProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </StoreProvider>
    </LanguageProvider>
  );
}

export default App;
