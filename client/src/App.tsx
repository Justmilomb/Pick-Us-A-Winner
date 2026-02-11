import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import GiveawayTool from "@/pages/tool";
import { ProtectedRoute } from "@/lib/protected-route";
import ComingSoon from "@/pages/coming-soon";
import PrivacyPolicy from "@/pages/privacy";
import TermsOfService from "@/pages/terms";
import AnalyticsPage from "@/pages/analytics";
import SchedulePage from "@/pages/schedule";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tool" component={GiveawayTool} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/schedule/:token" component={SchedulePage} />
      <Route path="/coming-soon" component={ComingSoon} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;