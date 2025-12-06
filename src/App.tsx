import { Switch, Route, Redirect, useLocation } from "wouter";
import { useState, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/app/components/ui/toaster";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { ErrorBoundary } from "@/app/components/shared/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/app/pages/landing/Landing";
import BottomNav from "@/app/shared/BottomNav";
import PageTransition from "@/app/shared/PageTransition";
import { LoadingScreen } from "@/app/components/shared/LoadingScreen";

// Lazy load pages for better performance
const Login = lazy(() => import("@/app/pages/auth/Login"));
const Todo = lazy(() => import("@/app/pages/todo/Todo"));
const Calendar = lazy(() => import("@/app/pages/calendar/Calendar"));
const Reminders = lazy(() => import("@/app/pages/reminders/Reminders"));
const AI = lazy(() => import("@/app/pages/ai/AI"));
const Profile = lazy(() => import("@/app/pages/profile/Profile"));
const Pricing = lazy(() => import("@/app/pages/Pricing"));
const Roadmap = lazy(() => import("@/app/pages/Roadmap"));
const About = lazy(() => import("@/app/pages/About"));
const Collaboration = lazy(() => import("@/app/pages/Collaboration"));
const Contact = lazy(() => import("@/app/pages/Contact"));
const FeatureRequests = lazy(() => import("@/app/pages/FeatureRequests"));
const PrivacyPolicy = lazy(() => import("@/app/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/app/pages/TermsOfService"));
const NotFound = lazy(() => import("@/app/pages/NotFound"));

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const handleAddTask = () => {
    // Dispatch custom event to open add task dialog
    window.dispatchEvent(new CustomEvent('openAddTask'));
  };

  const handleAddReminder = () => {
    // Dispatch custom event to open add reminder dialog
    window.dispatchEvent(new CustomEvent('openAddReminder'));
  };

  const handleAddEvent = () => {
    // Dispatch custom event to open add event dialog
    window.dispatchEvent(new CustomEvent('openAddEvent'));
  };

  const handleAiClick = () => {
    // Dispatch custom event to open AI chat
    window.dispatchEvent(new CustomEvent('openAiChat'));
  };

  return (
    <>
      <PageTransition>
        <Suspense fallback={<LoadingScreen />}>
          {!isAuthenticated ? (
            <Switch>
              <Route path="/" component={Landing} />
              <Route path="/login" component={Login} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/roadmap" component={Roadmap} />
              <Route path="/about" component={About} />
              <Route path="/collaboration" component={Collaboration} />
              <Route path="/contact" component={Contact} />
              <Route path="/feature-requests" component={FeatureRequests} />
              <Route path="/privacy" component={PrivacyPolicy} />
              <Route path="/terms" component={TermsOfService} />
              <Route path="/app" component={() => <Redirect to="/login" />} />
              <Route path="/app/:rest*" component={() => <Redirect to="/login" />} />
              <Route component={() => <Redirect to="/" />} />
            </Switch>
          ) : (
            <Switch>
              <Route path="/" component={Landing} />
              <Route path="/login" component={() => <Redirect to="/app/todo" />} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/roadmap" component={Roadmap} />
              <Route path="/about" component={About} />
              <Route path="/collaboration" component={Collaboration} />
              <Route path="/contact" component={Contact} />
              <Route path="/feature-requests" component={FeatureRequests} />
              <Route path="/privacy" component={PrivacyPolicy} />
              <Route path="/terms" component={TermsOfService} />
              <Route path="/app" component={() => <Redirect to="/app/todo" />} />
              <Route path="/app/reminders" component={Reminders} />
              <Route path="/app/todo" component={Todo} />
              <Route path="/app/calendar" component={Calendar} />
              <Route path="/app/ai" component={AI} />
              <Route path="/app/profile" component={Profile} />
              <Route path="/:rest*" component={NotFound} />
            </Switch>
          )}
        </Suspense>
      </PageTransition>
      {isAuthenticated && location.startsWith('/app') && (
        <>
          {/* OnboardingDialog removed - will be replaced with account setup flow later */}
          <BottomNav 
            onAddTask={location === '/app/todo' ? handleAddTask : undefined}
            onAddReminder={location === '/app/reminders' ? handleAddReminder : undefined}
            onAddEvent={location === '/app/calendar' ? handleAddEvent : undefined}
            onAiClick={location !== '/app/todo' ? handleAiClick : undefined}
          />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
