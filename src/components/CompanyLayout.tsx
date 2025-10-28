import { Home, Briefcase, FileText, MessageSquare, User, Settings, Menu, X, UserSearch, Upload, Users, LogOut, CreditCard, Newspaper, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import drillityLogoDark from "@/assets/drillity-logo-dark.png";
import drillityLogoLight from "@/assets/drillity-logo-light.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTheme } from "@/hooks/useTheme";

const navigation = [
  { name: "Dashboard", href: "/company/dashboard", icon: Home },
  { name: "My Jobs", href: "/company/jobs", icon: Briefcase, section: "jobs" },
  { name: "Browse All Jobs", href: "/company/browse-jobs", icon: Search, indent: true, section: "jobs" },
  { name: "Import Jobs", href: "/company/jobs/import", icon: Upload, indent: true, section: "jobs" },
  { name: "Applications", href: "/company/applications", icon: FileText, indent: true, section: "jobs" },
  { name: "Browse Talent", href: "/company/talents", icon: UserSearch },
  { name: "News", href: "/company/news", icon: Newspaper },
  { name: "Contracts", href: "/company/contracts", icon: FileText, section: "contracts" },
  { name: "My Contracts", href: "/company/contracts", icon: FileText, indent: true, section: "contracts" },
  { name: "Browse Contracts", href: "/company/browse-contracts", icon: Search, indent: true, section: "contracts" },
  { name: "Messages", href: "/company/messages", icon: MessageSquare },
  { name: "Company Profile", href: "/company/profile", icon: User, section: "profile" },
  { name: "Team", href: "/company/team", icon: Users, indent: true, section: "profile" },
  { name: "Settings", href: "/company/settings", icon: Settings },
];

export const CompanyLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Auto-expand sections based on current route
  const isOnJobsRoute = location.pathname.includes('/company/jobs') || 
                        location.pathname === '/company/browse-jobs' || 
                        location.pathname === '/company/applications';
  const isOnContractsRoute = location.pathname === '/company/contracts' || 
                             location.pathname === '/company/browse-contracts';
  const isOnProfileRoute = location.pathname === '/company/profile' || 
                           location.pathname === '/company/team';
  
  const [jobsSectionExpanded, setJobsSectionExpanded] = useState(isOnJobsRoute);
  const [contractsSectionExpanded, setContractsSectionExpanded] = useState(isOnContractsRoute);
  const [profileSectionExpanded, setProfileSectionExpanded] = useState(isOnProfileRoute);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("");

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || "");
      fetchCompanyName();
      fetchSubscriptionPlan();
    }
  }, [user]);

  // Update expanded sections when route changes
  useEffect(() => {
    const isOnJobsRoute = location.pathname.includes('/company/jobs') || 
                          location.pathname === '/company/browse-jobs' || 
                          location.pathname === '/company/applications';
    const isOnContractsRoute = location.pathname === '/company/contracts' || 
                               location.pathname === '/company/browse-contracts';
    const isOnProfileRoute = location.pathname === '/company/profile' || 
                             location.pathname === '/company/team';
    
    setJobsSectionExpanded(isOnJobsRoute);
    setContractsSectionExpanded(isOnContractsRoute);
    setProfileSectionExpanded(isOnProfileRoute);
  }, [location.pathname]);

  const fetchCompanyName = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('company_profiles')
      .select('company_name')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setCompanyName(data.company_name);
    }
  };

  const fetchSubscriptionPlan = async () => {
    if (!user) return;
    
    const { data: companyData } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (companyData) {
      const { data: subscriptionData } = await supabase
        .from('company_subscriptions')
        .select('plan_id, subscription_plans(name)')
        .eq('company_id', companyData.id)
        .eq('is_active', true)
        .single();

      if (subscriptionData?.subscription_plans) {
        setSubscriptionPlan((subscriptionData.subscription_plans as any).name);
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const logoSrc = theme === 'light' ? drillityLogoLight : drillityLogoDark;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
        <div className="flex items-center">
          <img src={logoSrc} alt="Drillity" className="h-8" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-sidebar border-r border-sidebar-border lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-6">
            <img src={logoSrc} alt="Drillity" className="h-8" />
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <div className="mb-2 flex items-center justify-between px-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Company</span>
              <ThemeSwitcher />
            </div>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const isMyJobs = item.section === "jobs" && !item.indent;
              const isContracts = item.section === "contracts" && !item.indent;
              const isProfile = item.section === "profile" && !item.indent;
              const shouldHideJobs = item.section === "jobs" && item.indent && !jobsSectionExpanded;
              const shouldHideContracts = item.section === "contracts" && item.indent && !contractsSectionExpanded;
              const shouldHideProfile = item.section === "profile" && item.indent && !profileSectionExpanded;
              
              if (shouldHideJobs || shouldHideContracts || shouldHideProfile) return null;
              
              if (isMyJobs) {
                return (
                  <div key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors px-3",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setJobsSectionExpanded(!jobsSectionExpanded);
                        }}
                        className="ml-auto"
                      >
                        {jobsSectionExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </Link>
                  </div>
                );
              }
              
              if (isContracts) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => setContractsSectionExpanded(!contractsSectionExpanded)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors px-3 w-full text-left",
                        "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                      <div className="ml-auto">
                        {contractsSectionExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </button>
                  </div>
                );
              }

              if (isProfile) {
                return (
                  <div key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors px-3",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setProfileSectionExpanded(!profileSectionExpanded);
                        }}
                        className="ml-auto"
                      >
                        {profileSectionExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </Link>
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    item.indent ? "pl-9 pr-3" : "px-3"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <Link
              to="/company/subscription"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-3 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 w-full"
            >
              <CreditCard className="h-5 w-5" />
              <div className="flex-1">
                <p className="font-medium">Subscription</p>
                {subscriptionPlan && <p className="text-xs text-muted-foreground">{subscriptionPlan}</p>}
              </div>
            </Link>
            <div className="mb-3 px-3">
              <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
              <p className="text-sm font-semibold truncate">{companyName || userEmail}</p>
              {companyName && <p className="text-xs text-muted-foreground truncate">{userEmail}</p>}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 w-full"
            >
              <LogOut className="h-5 w-5" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed top-16 left-0 right-0 bg-sidebar border-b border-sidebar-border animate-slide-in-top shadow-lg">
            <div className="flex flex-col max-h-[calc(100vh-4rem)] overflow-y-auto">
              <nav className="flex-1 space-y-1 p-4">
                <div className="mb-2 flex items-center justify-between px-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Company</span>
                  <ThemeSwitcher />
                </div>
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  const isMyJobs = item.section === "jobs" && !item.indent;
                  const isContracts = item.section === "contracts" && !item.indent;
                  const isProfile = item.section === "profile" && !item.indent;
                  const shouldHideJobs = item.section === "jobs" && item.indent && !jobsSectionExpanded;
                  const shouldHideContracts = item.section === "contracts" && item.indent && !contractsSectionExpanded;
                  const shouldHideProfile = item.section === "profile" && item.indent && !profileSectionExpanded;
                  
                  if (shouldHideJobs || shouldHideContracts || shouldHideProfile) return null;
                  
                  if (isMyJobs) {
                    return (
                      <div key={item.name}>
                        <Link
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors px-3",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.name}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setJobsSectionExpanded(!jobsSectionExpanded);
                            }}
                            className="ml-auto"
                          >
                            {jobsSectionExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </Link>
                      </div>
                    );
                  }
                  
                  if (isContracts) {
                    return (
                      <div key={item.name}>
                        <button
                          onClick={() => setContractsSectionExpanded(!contractsSectionExpanded)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors px-3 w-full text-left",
                            "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.name}
                          <div className="ml-auto">
                            {contractsSectionExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </button>
                      </div>
                    );
                  }

                  if (isProfile) {
                    return (
                      <div key={item.name}>
                        <Link
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors px-3",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.name}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setProfileSectionExpanded(!profileSectionExpanded);
                            }}
                            className="ml-auto"
                          >
                            {profileSectionExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </Link>
                      </div>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                        item.indent ? "pl-9 pr-3" : "px-3"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-sidebar-border">
                <Link
                  to="/company/subscription"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-3 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 w-full"
                >
                  <CreditCard className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">Subscription</p>
                    {subscriptionPlan && <p className="text-xs text-muted-foreground">{subscriptionPlan}</p>}
                  </div>
                </Link>
                <div className="mb-3 px-3">
                  <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
                  <p className="text-sm font-semibold truncate">{companyName || userEmail}</p>
                  {companyName && <p className="text-xs text-muted-foreground truncate">{userEmail}</p>}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 w-full"
                >
                  <LogOut className="h-5 w-5" />
                  Log Out
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 pt-16 lg:ml-36 lg:pt-0">
        <div className="pl-0 pr-4 py-6 md:py-8">
          {children}
          <Outlet />
        </div>
      </main>
    </div>
  );
};
