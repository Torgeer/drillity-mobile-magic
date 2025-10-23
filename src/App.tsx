import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Applications from "./pages/Applications";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyJobs from "./pages/company/CompanyJobs";
import CompanyApplications from "./pages/company/CompanyApplications";
import BrowseTalent from "./pages/company/BrowseTalent";
import PostJob from "./pages/company/PostJob";
import CompanySettings from "./pages/company/CompanySettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Talent Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Company Routes */}
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/company/jobs" element={<CompanyJobs />} />
          <Route path="/company/jobs/new" element={<PostJob />} />
          <Route path="/company/applications" element={<CompanyApplications />} />
          <Route path="/company/talents" element={<BrowseTalent />} />
          <Route path="/company/messages" element={<Messages />} />
          <Route path="/company/profile" element={<Profile />} />
          <Route path="/company/settings" element={<CompanySettings />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
