import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CVUpload } from "@/components/CVUpload";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Linkedin, Facebook, Instagram, CheckCircle, XCircle } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSkills();
      fetchCertifications();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("talent_skills")
        .select("*")
        .eq("talent_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  const fetchCertifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("talent_certifications")
        .select("*")
        .eq("talent_id", user.id)
        .order("issue_date", { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      console.error("Error fetching certifications:", error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isEditing && user) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Update your professional information</p>
          </div>
          <ProfileEditForm
            userId={user.id}
            profile={profile}
            onSuccess={() => {
              setIsEditing(false);
              fetchProfile();
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </Layout>
    );
  }

  const getAvailabilityBadge = () => {
    if (!profile?.availability_status) return null;
    
    const statusMap: Record<string, { label: string; variant: "default" | "outline" | "secondary" }> = {
      available: { label: "Available for work", variant: "default" },
      employed: { label: "Currently employed", variant: "secondary" },
      not_available: { label: "Not available", variant: "outline" },
    };

    const status = statusMap[profile.availability_status];
    return status ? <Badge variant={status.variant}>{status.label}</Badge> : null;
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const experienceAreas = [
    { key: "drilling_experience", label: "Drilling" },
    { key: "offshore_experience", label: "Offshore" },
    { key: "mining_experience", label: "Mining" },
    { key: "prospecting_experience", label: "Prospecting" },
    { key: "foundation_experience", label: "Foundation" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Professional profile</p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        </div>

        <Card className="ad-card">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl sm:text-4xl font-bold text-primary flex-shrink-0">
              {getInitials(profile?.full_name)}
            </div>
            <div className="flex-1 text-center sm:text-left w-full">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">
                {profile?.full_name || "No name set"}
              </h2>
              <p className="text-muted-foreground mb-2 text-sm sm:text-base break-all sm:break-normal">
                {profile?.email}
              </p>
              {profile?.phone && (
                <p className="text-muted-foreground mb-2 text-sm">
                  {profile.phone}
                </p>
              )}
              {profile?.location && (
                <p className="text-muted-foreground mb-4 text-sm">
                  📍 {profile.location}
                </p>
              )}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {getAvailabilityBadge()}
                {profile?.has_passport && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Valid Passport
                  </Badge>
                )}
                {profile?.experience_years > 0 && (
                  <Badge variant="outline">
                    {profile.experience_years} years experience
                  </Badge>
                )}
              </div>

              {profile?.bio && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {profile.bio}
                </p>
              )}

              {(profile?.linkedin_url || profile?.facebook_url || profile?.instagram_url) && (
                <div className="flex gap-3 mt-4 justify-center sm:justify-start">
                  {profile?.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {profile?.facebook_url && (
                    <a
                      href={profile.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {profile?.instagram_url && (
                    <a
                      href={profile.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {experienceAreas.some((area) => profile?.[area.key]) && (
          <Card className="ad-card">
            <h3 className="text-xl font-semibold mb-4">Industry Experience</h3>
            <div className="flex flex-wrap gap-2">
              {experienceAreas.map(
                (area) =>
                  profile?.[area.key] && (
                    <Badge key={area.key} className="bg-success/20 text-success">
                      {area.label}
                    </Badge>
                  )
              )}
            </div>
          </Card>
        )}

        {user && <CVUpload userId={user.id} />}

        <Card className="ad-card">
          <h3 className="text-xl font-semibold mb-4">Skills</h3>
          {skills.length > 0 ? (
            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between">
                  <span>{skill.skill_name}</span>
                  <Badge
                    className={
                      skill.skill_level === "expert"
                        ? "bg-success/20 text-success"
                        : skill.skill_level === "advanced"
                        ? "bg-primary/20 text-primary"
                        : "bg-warning/20 text-warning"
                    }
                  >
                    {skill.skill_level}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No skills listed yet.</p>
          )}
        </Card>

        <Card className="ad-card">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Certifications</h3>
          {certifications.length > 0 ? (
            <div className="space-y-3">
              {certifications.map((cert) => (
                <div key={cert.id} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium">{cert.certification_name}</p>
                    {cert.issuer && (
                      <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    )}
                    {cert.issue_date && (
                      <p className="text-xs text-muted-foreground">
                        Issued: {new Date(cert.issue_date).toLocaleDateString()}
                        {cert.expiry_date && ` - Expires: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No certifications listed yet.</p>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
