import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Mail, Phone, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ApplicationRow {
  id: string;
  status: string;
  applied_at: string;
  company_id: string;
  talent_id: string;
  job_id: string;
}

interface TalentProfile {
  id: string;
  full_name: string | null;
  email: string;
  location: string | null;
}

const CompanyApplications = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, TalentProfile>>({});
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "reviewing" | "interviewing">("all");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        // 1) Resolve company id for current user
        const { data: company, error: companyErr } = await supabase
          .from("company_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (companyErr || !company) throw companyErr || new Error("Company not found");

        // 2) Fetch applications for this company (simple SELECT to satisfy RLS)
        const { data: applications, error: appsErr } = await supabase
          .from("applications")
          .select("id,status,applied_at,company_id,talent_id,job_id")
          .eq("company_id", company.id)
          .order("applied_at", { ascending: false });
        if (appsErr) throw appsErr;

        setApps(applications || []);

        // 3) Fetch basic profiles for all unique talents (profiles are publicly selectable via RLS true)
        const talentIds = Array.from(new Set((applications || []).map(a => a.talent_id)));
        if (talentIds.length) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email, location")
            .in("id", talentIds);
          const byId: Record<string, TalentProfile> = {};
          (profiles || []).forEach(p => { byId[p.id] = p as TalentProfile; });
          setProfilesById(byId);
        }
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) load();
  }, [user, authLoading]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return apps;
    return apps.filter(a => a.status === activeTab);
  }, [apps, activeTab]);

  if (authLoading || loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex gap-4 border-b border-border pb-2">
          <button onClick={() => setActiveTab("all")} className={`px-4 py-2 text-sm font-medium ${activeTab === "all" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            All ({apps.length})
          </button>
          <button onClick={() => setActiveTab("pending")} className={`px-4 py-2 text-sm font-medium ${activeTab === "pending" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            Pending
          </button>
          <button onClick={() => setActiveTab("reviewing")} className={`px-4 py-2 text-sm font-medium ${activeTab === "reviewing" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            Reviewing
          </button>
          <button onClick={() => setActiveTab("interviewing")} className={`px-4 py-2 text-sm font-medium ${activeTab === "interviewing" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            Interviewing
          </button>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No applications found for this view.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => {
              const profile = profilesById[app.talent_id];
              return (
                <Card key={app.id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                        {(profile?.full_name || profile?.email || "?")
                          .split(" ")
                          .map(n => n[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{profile?.full_name || profile?.email || "Unknown candidate"}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground min-w-0">
                          {profile?.location && (
                            <div className="flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</div>
                          )}
                          <div className="flex items-center gap-1"><Mail className="h-4 w-4" />{profile?.email || "n/a"}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline">{app.status}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(app.applied_at).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="w-full sm:w-auto">
                      <FileText className="h-4 w-4 mr-2" /> View CV
                    </Button>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">Schedule Interview</Button>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">Message</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default CompanyApplications;
