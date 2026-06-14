import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BookService from "./pages/BookService";
import MyBookings from "./pages/MyBookings";
import BookingDetail from "./pages/BookingDetail";
import Profile from "./pages/Profile";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderJobDetail from "./pages/ProviderJobDetail";
import AdminDashboard from "./pages/AdminDashboard";
import ServiceDetail from "./pages/ServiceDetail";
import ProviderOnboarding from "./pages/ProviderOnboarding";

function Router() {
  return (
    <Switch>
      {/* Public / Customer Routes */}
      <Route path="/" component={Home} />
      <Route path="/services/:id" component={ServiceDetail} />
      <Route path="/book" component={BookService} />
      <Route path="/bookings" component={MyBookings} />
      <Route path="/bookings/:id" component={BookingDetail} />
      <Route path="/profile" component={Profile} />

      {/* Provider Routes */}
      <Route path="/provider" component={ProviderDashboard} />
      <Route path="/provider/jobs/:id" component={ProviderJobDetail} />
      <Route path="/provider/onboarding" component={ProviderOnboarding} />

      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
