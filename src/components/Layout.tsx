import { Home, Briefcase, FileText, MessageSquare, User, Settings, Menu, X, LogOut, Newspaper } from "lucide-react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import drillityLogo from "@/assets/drillity-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Browse Jobs", href: "/jobs", icon: Briefcase },
  { name: "My Applications", href: "/applications", icon: FileText },
  { name: "Company News", href: "/news", icon: Newspaper },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "My Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || "");
      fetchUserName();
    }
  }, [user]);

  const fetchUserName = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (data?.full_name) {
      setUserName(data.full_name);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
        <div className="flex items-center">
          <img src={drillityLogo} alt="Drillity" className="h-8" />
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
            <img src={drillityLogo} alt="Drillity" className="h-8" />
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <div className="mb-2 flex items-center justify-between px-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Talent</span>
              <ThemeSwitcher />
            </div>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <div className="mb-3 px-3">
              <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
              <p className="text-sm font-semibold truncate">{userName || userEmail}</p>
              {userName && <p className="text-xs text-muted-foreground truncate">{userEmail}</p>}
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
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Talent</span>
                  <ThemeSwitcher />
                </div>
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-sidebar-border">
                <div className="mb-3 px-3">
                  <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
                  <p className="text-sm font-semibold truncate">{userName || userEmail}</p>
                  {userName && <p className="text-xs text-muted-foreground truncate">{userEmail}</p>}
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

      <main className="flex-1 pt-16 lg:ml-64 lg:pt-0">
        <div className="pl-0 pr-4 py-6 md:py-8">
          {children}
          <Outlet />
        </div>
      </main>
    </div>
  );
};
