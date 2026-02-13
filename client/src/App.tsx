import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import GiveawayTool from "@/pages/tool";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import { AuthProvider } from "@/hooks/use-user";
import { ProtectedRoute } from "@/lib/protected-route";
import ComingSoon from "@/pages/coming-soon";
import PrivacyPolicy from "@/pages/privacy";
import TermsOfService from "@/pages/terms";
import AnalyticsPage from "@/pages/analytics";
import SchedulePage from "@/pages/schedule";
import SpinTheWheel from "@/pages/spin-the-wheel";
import RandomNamePicker from "@/pages/random-name-picker";
import RandomOptionPicker from "@/pages/random-option-picker";
import GiveawayGenerator from "@/pages/giveaway-generator";
import HowItWorks from "@/pages/how-it-works";
import InstagramGiveawayGuide from "@/pages/instagram-giveaway-guide";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tool" component={GiveawayTool} />
      <Route path="/spin-the-wheel" component={SpinTheWheel} />
      <Route path="/random-name-picker" component={RandomNamePicker} />
      <Route path="/random-option-picker" component={RandomOptionPicker} />
      <Route path="/giveaway-generator" component={GiveawayGenerator} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/instagram-giveaway-guide" component={InstagramGiveawayGuide} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/schedule/:token" component={SchedulePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
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
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;