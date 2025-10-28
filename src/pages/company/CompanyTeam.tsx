import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, Shield, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamMember {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
}

const CompanyTeam = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!companyProfile) return;

      const { data, error } = await supabase
        .from("company_contacts")
        .select("*")
        .eq("company_id", companyProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const inviteMember = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("id, company_name")
        .eq("user_id", user.id)
        .single();

      if (!companyProfile) throw new Error("Company profile not found");

      // Add to company_contacts
      const { error } = await supabase
        .from("company_contacts")
        .insert({
          company_id: companyProfile.id,
          email: newMemberEmail,
          role: newMemberRole,
          full_name: newMemberEmail.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newMemberEmail}`
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Team member added",
      });

      setNewMemberEmail("");
      setNewMemberRole("member");
      loadTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("company_contacts")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Removed",
        description: "Team member removed",
      });

      loadTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-destructive/10 text-destructive",
      manager: "bg-primary/10 text-primary",
      recruiter: "bg-accent/10 text-accent-foreground",
      member: "bg-muted text-muted-foreground",
    };

    return colors[role] || colors.member;
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground">Manage users who have access to the company account</p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite team member
          </h2>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="member@example.com"
                />
              </div>

              <div>
                <Label>Role</Label>
                <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member - View jobs</SelectItem>
                    <SelectItem value="recruiter">Recruiter - Manage applications</SelectItem>
                    <SelectItem value="manager">Manager - Create/edit jobs</SelectItem>
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={inviteMember} disabled={!newMemberEmail || loading}>
              <Mail className="h-4 w-4 mr-2" />
              {loading ? "Inviting..." : "Invite"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Team Members ({members.length})</h2>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {member.avatar_url ? (
                    <img 
                      src={member.avatar_url} 
                      alt={member.full_name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {member.full_name?.[0] || member.email?.[0] || "?"}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{member.full_name || "Unnamed"}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    {member.phone && (
                      <p className="text-xs text-muted-foreground">{member.phone}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getRoleBadge(member.role || 'member')}`}>
                    <Shield className="h-3 w-3" />
                    {member.role || 'member'}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No team members yet. Invite your colleagues!
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold mb-2">About Roles</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><strong>Member:</strong> Can only view jobs and statistics</li>
            <li><strong>Recruiter:</strong> Can manage applications and contact candidates</li>
            <li><strong>Manager:</strong> Can create, edit and delete jobs</li>
            <li><strong>Admin:</strong> Full access including company settings and team management</li>
          </ul>
        </Card>
      </div>
    </CompanyLayout>
  );
};

export default CompanyTeam;
