import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Briefcase, Users, MessageSquare, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <span className="text-xl font-bold text-primary-foreground">D</span>
              </div>
              <span className="text-2xl font-bold">Drillity</span>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate("/auth")}>Sign In</Button>
              <Button onClick={() => navigate("/auth")}>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h1 className="mb-6 text-5xl font-bold leading-tight">
            Your Career in Drilling <span className="text-primary">Starts Here</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Connect with top drilling companies worldwide. Find your next opportunity in offshore, onshore, and directional drilling.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Find Jobs
            </Button>
            <Button size="lg" variant="outline">
              For Employers
            </Button>
          </div>
        </section>

        <section className="border-t border-border bg-card/50">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold">Why Choose Drillity?</h2>
              <p className="text-muted-foreground">The platform built for drilling professionals</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">1200+ Jobs</h3>
                <p className="text-sm text-muted-foreground">
                  Access thousands of drilling positions worldwide
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Top Companies</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with leading drilling operators
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Direct Messaging</h3>
                <p className="text-sm text-muted-foreground">
                  Communicate directly with employers
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Safety First</h3>
                <p className="text-sm text-muted-foreground">
                  All positions meet industry safety standards
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold">Featured Jobs</h2>
              <p className="text-muted-foreground">Start your journey today</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
                <div className="mb-3 flex gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Full-time
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Remote
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-primary">Senior Drilling Engineer</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Offshore Drillers — Houston, TX — Full-time
                </p>
                <p className="mb-4 text-sm">
                  Lead drilling operations for offshore projects. Experience with deepwater rigs required.
                </p>
                <Button size="sm">View Details</Button>
              </div>

              <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
                <div className="mb-3 flex gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Contract
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Texas
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-primary">Rig Mechanic</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  DeepSea Services — Stavanger, Norway — Contract
                </p>
                <p className="mb-4 text-sm">
                  Oversee safety compliance and training on-site. Must have OSHA certification.
                </p>
                <Button size="sm">View Details</Button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button onClick={() => navigate("/auth")}>View All Jobs</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">D</span>
              </div>
              <span className="text-xl font-bold">Drillity</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Drillity. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
