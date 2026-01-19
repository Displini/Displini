import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/general/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing/Landing";
import BottomNav from "@/components/general/BottomNav";
import PageTransition from "@/components/general/PageTransition";
import { LoadingScreen } from "@/components/general/LoadingScreen";

// Lazy load pages for better performance
const Login = lazy(() => import("@/pages/auth/Login"));
const SignUp = lazy(() => import("@/pages/auth/SignUp"));
const Todo = lazy(() => import("@/pages/todo/Todo"));
const Calendar = lazy(() => import("@/pages/calendar/Calendar"));
const Reminders = lazy(() => import("@/pages/reminders/Reminders"));
const AI = lazy(() => import("@/pages/ai/AI"));
const Profile = lazy(() => import("@/pages/profile/Profile"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Roadmap = lazy(() => import("@/pages/Roadmap"));
const About = lazy(() => import("@/pages/About"));
const Collaboration = lazy(() => import("@/pages/Collaboration"));
const Contact = lazy(() => import("@/pages/Contact"));
const FeatureRequests = lazy(() => import("@/pages/FeatureRequests"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

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
          <Routes>
            {!isAuthenticated ? (
              <>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<SignUp />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/about" element={<About />} />
                <Route path="/collaboration" element={<Collaboration />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/feature-requests" element={<FeatureRequests />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/app" element={<Navigate to="/auth/login" replace />} />
                <Route path="/app/*" element={<Navigate to="/auth/login" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Navigate to="/app/todo" replace />} />
                <Route path="/auth/login" element={<Navigate to="/app/todo" replace />} />
                <Route path="/auth/signup" element={<Navigate to="/app/todo" replace />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/about" element={<About />} />
                <Route path="/collaboration" element={<Collaboration />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/feature-requests" element={<FeatureRequests />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/app" element={<Navigate to="/app/todo" replace />} />
                <Route path="/app/reminders" element={<Reminders />} />
                <Route path="/app/todo" element={<Todo />} />
                <Route path="/app/calendar" element={<Calendar />} />
                <Route path="/app/ai" element={<AI />} />
                <Route path="/app/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </Suspense>
      </PageTransition>
      {isAuthenticated && location.pathname.startsWith('/app') && (
        <>
          {/* OnboardingDialog removed - will be replaced with account setup flow later */}
          <BottomNav 
            onAddTask={location.pathname === '/app/todo' ? handleAddTask : undefined}
            onAddReminder={location.pathname === '/app/reminders' ? handleAddReminder : undefined}
            onAddEvent={location.pathname === '/app/calendar' ? handleAddEvent : undefined}
            onAiClick={location.pathname !== '/app/todo' ? handleAiClick : undefined}
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
            <BrowserRouter>
              <Toaster />
              <Router />
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
