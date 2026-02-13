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
import WheelPage from "@/pages/wheel";
import PickerPage from "@/pages/picker";
import YouTubePage from "@/pages/youtube";
import TikTokPage from "@/pages/tiktok";
import InstagramScraperPage from "@/pages/instagram-scraper";
import FacebookPage from "@/pages/facebook-picker";
import TwitterPage from "@/pages/twitter-picker";
import PressPage from "@/pages/press";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tool" component={GiveawayTool} />
      <Route path="/instagram-comment-scraper" component={InstagramScraperPage} />
      <Route path="/facebook-picker" component={FacebookPage} />
      <Route path="/twitter-picker" component={TwitterPage} />
      <Route path="/wheel" component={WheelPage} />
      <Route path="/picker" component={PickerPage} />
      <Route path="/youtube" component={YouTubePage} />
      <Route path="/tiktok" component={TikTokPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/schedule/:token" component={SchedulePage} />
      <Route path="/coming-soon" component={ComingSoon} />
      <Route path="/press" component={PressPage} />
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