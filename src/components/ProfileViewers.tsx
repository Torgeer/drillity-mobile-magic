import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ProfileView {
  id: string;
  viewed_at: string;
  company_profiles: {
    company_name: string;
    logo_url: string | null;
    location: string | null;
  };
}

interface ProfileViewersProps {
  talentId: string;
  enabled: boolean;
  limit: number;
}

export const ProfileViewers = ({ talentId, enabled, limit }: ProfileViewersProps) => {
  const [viewers, setViewers] = useState<ProfileView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (enabled) {
      fetchViewers();
    }
  }, [talentId, enabled]);

  const fetchViewers = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_views')
        .select(`
          id,
          viewed_at,
          company_id
        `)
        .eq('talent_id', talentId)
        .order('viewed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch company details separately
      if (data && data.length > 0) {
        const companyIds = data.map(v => v.company_id);
        const { data: companies } = await supabase
          .from('company_profiles')
          .select('id, company_name, logo_url, location')
          .in('id', companyIds);

        const viewsWithCompanies = data.map(view => {
          const company = companies?.find(c => c.id === view.company_id);
          return {
            ...view,
            company_profiles: company || {
              company_name: 'Unknown Company',
              logo_url: null,
              location: null
            }
          };
        });

        setViewers(viewsWithCompanies as ProfileView[]);
      }
    } catch (error) {
      console.error('Error fetching profile viewers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!enabled) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Who Viewed My Profile</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-2">🔒 Premium Feature</p>
          <p className="text-sm">Upgrade to BASIC or higher to see who viewed your profile</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Who Viewed My Profile</h3>
        </div>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Eye className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Who Viewed My Profile</h3>
      </div>

      {viewers.length === 0 ? (
        <p className="text-muted-foreground text-sm">No profile views yet</p>
      ) : (
        <div className="space-y-3">
          {viewers.map((view) => (
            <div key={view.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarImage src={view.company_profiles.logo_url || undefined} />
                <AvatarFallback>{view.company_profiles.company_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{view.company_profiles.company_name}</p>
                {view.company_profiles.location && (
                  <p className="text-xs text-muted-foreground truncate">{view.company_profiles.location}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
