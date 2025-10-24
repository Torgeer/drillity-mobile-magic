import { Home, Briefcase, FileText, MessageSquare, User, Settings, Menu, X, UserSearch, Upload, Users, LogOut, Search, HelpCircle, MoreHorizontal, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import drillityLogo from "@/assets/drillity-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mainNavigation = [
  { name: "Dashboard", href: "/company/dashboard", icon: Home },
  { name: "My Jobs", href: "/company/jobs", icon: Briefcase },
  { name: "Applications", href: "/company/applications", icon: FileText },
  { name: "Messages", href: "/company/messages", icon: MessageSquare },
  { name: "Team", href: "/company/team", icon: Users },
];

const secondaryNavigation = [
  { name: "Browse Talent", href: "/company/talents", icon: UserSearch },
  { name: "Import Jobs", href: "/company/jobs/import", icon: Upload },
  { name: "Company Profile", href: "/company/profile", icon: User },
];

export const CompanyLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const cycleTheme = () => {
    const themes = ["dark", "gray", "light"] as const;
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <img src={drillityLogo} alt="Drillity" className="h-6" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] border-r bg-gradient-to-br from-background via-background to-primary/20 lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center border-b px-3">
            <Link to="/company/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-foreground">
                <span className="text-xs font-bold">D</span>
              </div>
              <span className="font-semibold">Drillity</span>
            </Link>
          </div>

          {/* Quick Action Button */}
          <div className="p-3">
            <Button 
              onClick={() => navigate('/company/jobs/new')}
              className="w-full justify-start gap-2 bg-foreground text-background hover:bg-foreground/90"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Post Job
            </Button>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
            {mainNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}

            {/* Resources Section */}
            <div className="pt-4">
              <div className="px-3 pb-2 text-xs font-medium text-muted-foreground">
                Resources
              </div>
              {secondaryNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                    {item.name === "Import Jobs" && (
                      <MoreHorizontal className="ml-auto h-4 w-4" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom Actions */}
          <div className="border-t p-3 space-y-1">
            <Link
              to="/company/settings"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location.pathname === "/company/settings"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={cycleTheme}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
            >
              <HelpCircle className="h-4 w-4" />
              Theme: {theme}
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>

          {/* User Profile */}
          <div className="border-t p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-medium truncate w-full">{user?.email?.split('@')[0] || "User"}</span>
                <span className="text-xs text-muted-foreground truncate w-full">{user?.email || ""}</span>
              </div>
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed top-14 left-0 right-0 bg-gradient-to-br from-background via-background to-primary/20 border-b shadow-lg">
            <div className="flex flex-col max-h-[calc(100vh-3.5rem)] overflow-y-auto">
              <div className="p-3">
                <Button 
                  onClick={() => {
                    navigate('/company/jobs/new');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start gap-2"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Post Job
                </Button>
              </div>

              <nav className="flex-1 space-y-1 px-3 py-2">
                {mainNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}

                <div className="pt-4">
                  <div className="px-3 pb-2 text-xs font-medium text-muted-foreground">
                    Resources
                  </div>
                  {secondaryNavigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent/50"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="border-t p-3 space-y-1">
                <Link
                  to="/company/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    cycleTheme();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50"
                >
                  <HelpCircle className="h-4 w-4" />
                  Theme: {theme}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 pt-14 lg:pl-[240px] lg:pt-0 overflow-x-hidden w-full">
        <div className="mx-auto max-w-7xl p-4 md:p-6 w-full bg-gradient-to-br from-background via-background to-primary/10 min-h-screen">{children}</div>
      </main>
    </div>
  );
};
