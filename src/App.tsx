import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Applications from "./pages/Applications";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyJobs from "./pages/company/CompanyJobs";
import PostJob from "./pages/company/PostJob";
import JobDetail from "./pages/company/JobDetail";
import CompanyJobImport from "./pages/company/CompanyJobImport";
import CompanyApplications from "./pages/company/CompanyApplications";
import JobMatches from "./pages/company/JobMatches";
import BrowseTalent from "./pages/company/BrowseTalent";
import CompanyTeam from "./pages/company/CompanyTeam";
import CompanySettings from "./pages/company/CompanySettings";
import CompanyMessages from "./pages/company/CompanyMessages";
import CompanyProfile from "./pages/company/CompanyProfile";
import CompanyProfileEnhanced from "./pages/company/CompanyProfileEnhanced";
import CompanySubscription from "./pages/company/CompanySubscription";
import CompanyNews from "./pages/company/CompanyNews";
import CompanyContracts from "./pages/company/CompanyContracts";
import BrowseContracts from "./pages/company/BrowseContracts";
import BrowseJobs from "./pages/company/BrowseJobs";
import CompanyProjects from "./pages/company/CompanyProjects";
import News from "./pages/News";
import NotFound from "./pages/NotFound";
import { CompanyLayout } from "./components/CompanyLayout";
import { Layout } from "./components/Layout";

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
          <Route path="/install" element={<Install />} />
          
          {/* Talent Routes */}
          <Route element={<Layout><div /></Layout>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/news" element={<News />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* Company Routes */}
          <Route element={<CompanyLayout><div /></CompanyLayout>}>
            <Route path="/company/dashboard" element={<CompanyDashboard />} />
            <Route path="/company/jobs" element={<CompanyJobs />} />
            <Route path="/company/browse-jobs" element={<BrowseJobs />} />
            <Route path="/company/jobs/new" element={<PostJob />} />
            <Route path="/company/jobs/:id" element={<JobDetail />} />
            <Route path="/company/jobs/:jobId/matches" element={<JobMatches />} />
            <Route path="/company/jobs/edit/:id" element={<PostJob />} />
            <Route path="/company/jobs/import" element={<CompanyJobImport />} />
            <Route path="/company/applications" element={<CompanyApplications />} />
            <Route path="/company/talents" element={<BrowseTalent />} />
            <Route path="/company/team" element={<CompanyTeam />} />
            <Route path="/company/messages" element={<CompanyMessages />} />
            <Route path="/company/profile" element={<CompanyProfileEnhanced />} />
            <Route path="/company/subscription" element={<CompanySubscription />} />
            <Route path="/company/news" element={<CompanyNews />} />
            <Route path="/company/contracts" element={<CompanyContracts />} />
            <Route path="/company/browse-contracts" element={<BrowseContracts />} />
            <Route path="/company/projects" element={<CompanyProjects />} />
            <Route path="/company/settings" element={<CompanySettings />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
