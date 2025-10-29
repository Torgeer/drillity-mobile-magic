import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CVUpload } from "@/components/CVUpload";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { AddSkillDialog } from "@/components/AddSkillDialog";
import { AddCertificationDialog } from "@/components/AddCertificationDialog";
import { SkillSelector } from "@/components/SkillSelector";
import { ProfileViewers } from "@/components/ProfileViewers";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Plus, Trash2, AlertCircle, CheckCircle2, Star, Sparkles, Loader2 } from "lucide-react";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [skills, setSkills] = useState<Tables<"talent_skills">[]>([]);
  const [certifications, setCertifications] = useState<Tables<"talent_certifications">[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addSkillDialogOpen, setAddSkillDialogOpen] = useState(false);
  const [addCertDialogOpen, setAddCertDialogOpen] = useState(false);
  const [selectedSkillName, setSelectedSkillName] = useState("");
  const [showSkillSelector, setShowSkillSelector] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSkills();
      fetchCertifications();
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('talent-check-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('talent_skills')
        .select('*')
        .eq('talent_id', user.id);

      if (error) throw error;
      setSkills(data || []);
    } catch (error: any) {
      console.error('Error fetching skills:', error);
    }
  };

  const fetchCertifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('talent_certifications')
        .select('*')
        .eq('talent_id', user.id)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error: any) {
      console.error('Error fetching certifications:', error);
    }
  };

  const handleSkillSelect = (skillName: string) => {
    setSelectedSkillName(skillName);
    setShowSkillSelector(false);
    setAddSkillDialogOpen(true);
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('talent_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      toast({
        title: "Skill removed",
        description: "The skill has been removed from your profile.",
      });

      fetchSkills();
    } catch (error: any) {
      console.error('Error deleting skill:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove skill",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCertification = async (certId: string) => {
    try {
      const { error } = await supabase
        .from('talent_certifications')
        .delete()
        .eq('id', certId);

      if (error) throw error;

      toast({
        title: "Certification removed",
        description: "The certification has been removed from your profile.",
      });

      fetchCertifications();
    } catch (error: any) {
      console.error('Error deleting certification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove certification",
        variant: "destructive",
      });
    }
  };

  const getSkillLevelBadge = (level: Enums<"experience_level">) => {
    const config: Record<Enums<"experience_level">, string> = {
      entry: "bg-gray-500/20 text-gray-700",
      intermediate: "bg-yellow-500/20 text-yellow-700",
      senior: "bg-blue-500/20 text-blue-700",
      expert: "bg-green-500/20 text-green-700"
    };
    return config[level];
  };

  const getInitials = (name: string | null) => {
    if (!name) return profile?.email?.charAt(0).toUpperCase() || "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isCertificationExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return isPast(parseISO(expiryDate));
  };

  const handleGenerateBio = async () => {
    if (!user) return;
    
    setGeneratingBio(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-profile');
      
      if (error) throw error;
      
      if (data?.bio) {
        await supabase
          .from('profiles')
          .update({ bio: data.bio })
          .eq('id', user.id);
        
        toast({
          title: "Bio generated!",
          description: "Your profile bio has been created with AI.",
        });
        
        await fetchProfile();
      }
    } catch (error: any) {
      console.error('Error generating bio:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate bio",
        variant: "destructive",
      });
    } finally {
      setGeneratingBio(false);
    }
  };

  if (loading || !profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Professional profile</p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setEditDialogOpen(true)}>
            Edit Profile
          </Button>
        </div>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl sm:text-4xl font-bold text-primary flex-shrink-0">
                {getInitials(profile.full_name)}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left w-full">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">
                {profile.full_name || "Add your name"}
              </h2>
              <p className="text-muted-foreground mb-2 text-sm sm:text-base break-all sm:break-normal">
                {profile.email}
              </p>
              {profile.location && (
                <p className="text-sm text-muted-foreground mb-3">{profile.location}</p>
              )}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {subscription?.plan_details?.verified_badge && (
                  <Badge variant="default" className="bg-primary/20 text-primary border-primary/40">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {subscription?.plan_details?.featured_profile && (
                  <Badge variant="default" className="bg-warning/20 text-warning border-warning/40">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {profile.availability_status && (
                  <Badge variant="outline" className={
                    profile.availability_status === 'available' ? 'bg-success/20 text-success' :
                    profile.availability_status === 'busy' ? 'bg-warning/20 text-warning' :
                    'bg-gray-500/20 text-gray-700'
                  }>
                    {profile.availability_status === 'available' ? 'Available for work' :
                     profile.availability_status === 'busy' ? 'Currently busy' :
                     'Not looking'}
                  </Badge>
                )}
                {profile.experience_years !== null && profile.experience_years > 0 && (
                  <Badge variant="outline">{profile.experience_years} years experience</Badge>
                )}
                {profile.preferred_work_type && profile.preferred_work_type.length > 0 && (
                  profile.preferred_work_type.map(type => (
                    <Badge key={type} variant="outline" className="capitalize">
                      {type.replace('_', ' ')}
                    </Badge>
                  ))
                )}
              </div>
              {profile.bio ? (
                <p className="mt-4 text-sm">{profile.bio}</p>
              ) : subscription?.plan_details?.ai_profile_autofill && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleGenerateBio}
                  disabled={generatingBio}
                  className="mt-4"
                >
                  {generatingBio ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Bio with AI
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {user && <CVUpload userId={user.id} />}

        {user && subscription && (
          <ProfileViewers 
            talentId={user.id}
            enabled={subscription.plan_details?.profile_views_enabled || false}
            limit={subscription.plan_details?.profile_views_limit || 5}
          />
        )}

        <Card className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold">Skills</h3>
            <Button size="sm" onClick={() => setShowSkillSelector(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Skill
            </Button>
          </div>

          {skills.length === 0 ? (
            <p className="text-muted-foreground text-sm">No skills added yet. Add your first skill!</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {skills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between gap-2 group">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm sm:text-base truncate">{skill.skill_name}</span>
                    <Badge className={`${getSkillLevelBadge(skill.skill_level)} text-xs flex-shrink-0 capitalize`}>
                      {skill.skill_level}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={() => handleDeleteSkill(skill.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showSkillSelector && (
            <div className="mt-4 p-4 border rounded-lg">
              <SkillSelector 
                selectedSkills={[]} 
                onChange={(skills) => {
                  if (skills.length > 0) {
                    handleSkillSelect(skills[skills.length - 1]);
                  }
                }} 
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setShowSkillSelector(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold">Certifications</h3>
            <Button size="sm" onClick={() => setAddCertDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Certification
            </Button>
          </div>

          {certifications.length === 0 ? (
            <p className="text-muted-foreground text-sm">No certifications added yet.</p>
          ) : (
            <div className="space-y-3">
              {certifications.map((cert) => {
                const isExpired = isCertificationExpired(cert.expiry_date);
                
                return (
                  <div key={cert.id} className="flex items-start gap-3 group">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm sm:text-base">{cert.certification_name}</p>
                        {isExpired && (
                          <Badge variant="outline" className="bg-red-500/20 text-red-700 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        )}
                      </div>
                      {cert.issuer && (
                        <p className="text-xs sm:text-sm text-muted-foreground">{cert.issuer}</p>
                      )}
                      {(cert.issue_date || cert.expiry_date) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {cert.issue_date && `Issued ${formatDistanceToNow(parseISO(cert.issue_date), { addSuffix: true })}`}
                          {cert.issue_date && cert.expiry_date && " • "}
                          {cert.expiry_date && `Expires ${formatDistanceToNow(parseISO(cert.expiry_date), { addSuffix: true })}`}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => handleDeleteCertification(cert.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {profile && (
        <>
          <EditProfileDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            profile={profile}
            onSuccess={fetchProfile}
          />

          {user && (
            <>
              <AddSkillDialog
                open={addSkillDialogOpen}
                onOpenChange={setAddSkillDialogOpen}
                userId={user.id}
                skillName={selectedSkillName}
                onSuccess={fetchSkills}
              />

              <AddCertificationDialog
                open={addCertDialogOpen}
                onOpenChange={setAddCertDialogOpen}
                userId={user.id}
                onSuccess={fetchCertifications}
              />
            </>
          )}
        </>
      )}
    </Layout>
  );
};

export default Profile;
