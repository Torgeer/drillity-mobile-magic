import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Briefcase, Globe, Mail, Phone, Linkedin, Facebook, Instagram } from "lucide-react";

interface TalentProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  experience_years: number | null;
  availability_status: string | null;
  open_to_international: boolean | null;
  phone: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  drilling_experience: boolean | null;
  offshore_experience: boolean | null;
  mining_experience: boolean | null;
  prospecting_experience: boolean | null;
  foundation_experience: boolean | null;
  profile_visibility: string | null;
}

interface TalentSkill {
  skill_name: string;
  skill_level: string;
  industry: string | null;
}

interface TalentCertification {
  certification_name: string;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
}

const TalentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [skills, setSkills] = useState<TalentSkill[]>([]);
  const [certifications, setCertifications] = useState<TalentCertification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTalentDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (profileError) throw profileError;

        if (!profileData) {
          setError("Profile not found");
          return;
        }

        if (profileData.profile_visibility !== "public") {
          setError("This profile is private");
          return;
        }

        setTalent(profileData);

        // Fetch skills
        const { data: skillsData } = await supabase
          .from("talent_skills")
          .select("skill_name, skill_level, industry")
          .eq("talent_id", id);

        if (skillsData) setSkills(skillsData);

        // Fetch certifications
        const { data: certificationsData } = await supabase
          .from("talent_certifications")
          .select("certification_name, issuer, issue_date, expiry_date")
          .eq("talent_id", id);

        if (certificationsData) setCertifications(certificationsData);
      } catch (err: any) {
        console.error("Error fetching talent details:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchTalentDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-20 w-20 rounded-full mb-4" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !talent) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/company/talents")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">{error || "Profile not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const experiences = [
    { label: "Drilling", value: talent.drilling_experience },
    { label: "Offshore", value: talent.offshore_experience },
    { label: "Mining", value: talent.mining_experience },
    { label: "Prospecting", value: talent.prospecting_experience },
    { label: "Foundation", value: talent.foundation_experience },
  ].filter((exp) => exp.value);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate("/company/talents")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Browse
      </Button>

      <div className="grid gap-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={talent.avatar_url || ""} alt={talent.full_name || ""} />
                <AvatarFallback className="text-2xl">
                  {talent.full_name?.split(" ").map((n) => n[0]).join("") || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{talent.full_name || "Anonymous"}</CardTitle>
                <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
                  {talent.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{talent.location}</span>
                    </div>
                  )}
                  {talent.experience_years && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{talent.experience_years} years experience</span>
                    </div>
                  )}
                  {talent.open_to_international && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <span>Open to international</span>
                    </div>
                  )}
                </div>
                <Badge variant={talent.availability_status === "available" ? "default" : "secondary"}>
                  {talent.availability_status || "Unknown"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {talent.bio && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{talent.bio}</p>
              </div>
            )}

            {/* Contact Information */}
            <div className="flex flex-wrap gap-4">
              {talent.email && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${talent.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </a>
                </Button>
              )}
              {talent.phone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${talent.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </a>
                </Button>
              )}
              {talent.linkedin_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={talent.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
              )}
              {talent.facebook_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={talent.facebook_url} target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </a>
                </Button>
              )}
              {talent.instagram_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={talent.instagram_url} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4 mr-2" />
                    Instagram
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Experience Areas */}
        {experiences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Experience Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {experiences.map((exp) => (
                  <Badge key={exp.label} variant="secondary">
                    {exp.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {skills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{skill.skill_name}</p>
                      {skill.industry && (
                        <p className="text-sm text-muted-foreground">{skill.industry}</p>
                      )}
                    </div>
                    <Badge variant="outline">{skill.skill_level}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {certifications.map((cert, index) => (
                  <div key={index} className="p-3 rounded-lg border">
                    <p className="font-medium">{cert.certification_name}</p>
                    {cert.issuer && (
                      <p className="text-sm text-muted-foreground mt-1">Issued by: {cert.issuer}</p>
                    )}
                    {cert.issue_date && (
                      <p className="text-sm text-muted-foreground">
                        Issued: {new Date(cert.issue_date).toLocaleDateString()}
                        {cert.expiry_date && ` • Expires: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TalentDetail;
