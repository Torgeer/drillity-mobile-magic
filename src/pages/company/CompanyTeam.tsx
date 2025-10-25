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
  user_id: string;
  role: string;
  email?: string;
  full_name?: string;
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
        .from("company_users")
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .eq("company_id", companyProfile.id);

      if (error) throw error;

      // Fetch user details for each member
      const membersWithDetails = await Promise.all(
        (data || []).map(async (member) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", member.user_id)
            .single();

          return {
            ...member,
            email: profile?.email,
            full_name: profile?.full_name,
          };
        })
      );

      setMembers(membersWithDetails);
    } catch (error: any) {
      toast({
        title: "Fel",
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

      // Check if user exists
      const { data: invitedProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newMemberEmail)
        .single();

      if (!invitedProfile) {
        toast({
          title: "User not found",
          description: "The user must first create an account on Drillity",
          variant: "destructive",
        });
        return;
      }

      // Add to company_users
      const { error } = await supabase
        .from("company_users")
        .insert({
          company_id: companyProfile.id,
          user_id: invitedProfile.id,
          role: newMemberRole,
        });

      if (error) throw error;

      toast({
        title: "Framgång!",
        description: "Teammedlem har lagts till",
      });

      setNewMemberEmail("");
      setNewMemberRole("member");
      loadTeamMembers();
    } catch (error: any) {
      toast({
        title: "Fel",
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
        .from("company_users")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Borttagen",
        description: "Teammedlem har tagits bort",
      });

      loadTeamMembers();
    } catch (error: any) {
      toast({
        title: "Fel",
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
            Bjud in teammedlem
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
                <Label>Roll</Label>
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
              {loading ? "Bjuder in..." : "Bjud in"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Teammedlemmar ({members.length})</h2>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {member.full_name?.[0] || member.email?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium">{member.full_name || "Unnamed"}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getRoleBadge(member.role)}`}>
                    <Shield className="h-3 w-3" />
                    {member.role}
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
                Inga teammedlemmar ännu. Bjud in dina kollegor!
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
