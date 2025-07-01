import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import AppLayout from "@/components/layout/app-layout-fixed";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login-simple";
import LoginEmail from "@/pages/login-email";
import Signup from "@/pages/signup";
import Events from "@/pages/events";
import Tasks from "@/pages/tasks";
import Clients from "@/pages/clients";
import Payments from "@/pages/payments";
import Staff from "@/pages/staff";
import Quotations from "@/pages/quotations";
import Expenses from "@/pages/expenses";
import Finance from "@/pages/finance";
import Sheet from "@/pages/sheet";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/login" component={Login} />
        <Route path="/login-email" component={LoginEmail} />
        <Route path="/signup" component={Signup} />
        <Route path="/events" component={Events} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/clients" component={Clients} />
        <Route path="/payments" component={Payments} />
        <Route path="/staff" component={Staff} />
        <Route path="/quotations" component={Quotations} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/finance" component={Finance} />
        <Route path="/sheet" component={Sheet} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
