import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import JournalPage from "@/pages/journal-page";
import MoodPage from "@/pages/mood-page";
import MindfulnessPage from "@/pages/mindfulness-page";
import SubscriptionPage from "@/pages/subscription-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/journal" component={JournalPage} />
      <ProtectedRoute path="/journal/new" component={JournalPage} />
      <ProtectedRoute path="/journal/:id" component={JournalPage} />
      <ProtectedRoute path="/mood" component={MoodPage} />
      <ProtectedRoute path="/mindfulness" component={MindfulnessPage} />
      <ProtectedRoute path="/subscribe" component={SubscriptionPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
