import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Save } from "lucide-react";

interface CompanyProfile {
  id: string;
  company_name: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  location: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  foundation_sector: boolean;
  offshore_sector: boolean;
  mining_sector: boolean;
  prospecting_sector: boolean;
  infrastructure_sector: boolean;
}

const CompanyProfileEnhanced = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/auth");
      else if (userType === 'talent') navigate("/profile");
      else loadProfile();
    }
  }, [user, userType, loading, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) setProfile(data);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      toast.success("Logo selected - click Save to upload");
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !profile) return null;

    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);

    try {
      let logoUrl = profile.logo_url;
      
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) logoUrl = uploadedUrl;
      }

      const { error } = await supabase
        .from('company_profiles')
        .update({
          company_name: profile.company_name,
          description: profile.description,
          website: profile.website,
          industry: profile.industry,
          company_size: profile.company_size,
          location: profile.location,
          address: profile.address,
          contact_email: profile.contact_email,
          contact_phone: profile.contact_phone,
          logo_url: logoUrl,
          foundation_sector: profile.foundation_sector,
          offshore_sector: profile.offshore_sector,
          mining_sector: profile.mining_sector,
          prospecting_sector: profile.prospecting_sector,
          infrastructure_sector: profile.infrastructure_sector,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success("Company profile updated successfully!");
      loadProfile();
    } catch (error: any) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company Profile</h1>
          <p className="text-muted-foreground">Manage your company information and visibility</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Company Logo */}
          <Card className="p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Company Logo</h3>
            <div className="flex items-center gap-6">
              <div className="relative">
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt="Company Logo" className="h-24 w-24 object-cover rounded-lg" />
                ) : (
                  <div className="h-24 w-24 rounded-lg bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                    {profile.company_name.charAt(0)}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90">
                  <Upload className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upload your company logo</p>
                <p className="text-xs text-muted-foreground">Recommended: 400x400px, PNG or JPG</p>
              </div>
            </div>
          </Card>

          {/* Basic Information */}
          <Card className="p-6 mb-6 space-y-4">
            <h3 className="text-xl font-semibold">Basic Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Industry</Label>
                <Input
                  value={profile.industry || ''}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  placeholder="e.g. Oil & Gas, Mining"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={profile.description || ''}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                placeholder="Tell candidates about your company, mission, and culture..."
                rows={4}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Website</Label>
                <Input
                  type="url"
                  value={profile.website || ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <Label>Company Size</Label>
                <select
                  value={profile.company_size || ''}
                  onChange={(e) => setProfile({ ...profile, company_size: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6 mb-6 space-y-4">
            <h3 className="text-xl font-semibold">Contact Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={profile.contact_email || ''}
                  onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  type="tel"
                  value={profile.contact_phone || ''}
                  onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={profile.location || ''}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>

            <div>
              <Label>Full Address</Label>
              <Textarea
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Street address, City, State, ZIP, Country"
                rows={2}
              />
            </div>
          </Card>

          {/* Industry Sectors */}
          <Card className="p-6 mb-6 space-y-4">
            <h3 className="text-xl font-semibold">Industry Sectors</h3>
            <p className="text-sm text-muted-foreground">Select the sectors your company operates in</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.foundation_sector}
                  onChange={(e) => setProfile({ ...profile, foundation_sector: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <span>Foundation Drilling</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.offshore_sector}
                  onChange={(e) => setProfile({ ...profile, offshore_sector: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <span>Offshore Operations</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.mining_sector}
                  onChange={(e) => setProfile({ ...profile, mining_sector: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <span>Mining</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.prospecting_sector}
                  onChange={(e) => setProfile({ ...profile, prospecting_sector: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <span>Prospecting</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.infrastructure_sector}
                  onChange={(e) => setProfile({ ...profile, infrastructure_sector: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <span>Infrastructure</span>
              </label>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/company/dashboard")}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </CompanyLayout>
  );
};

export default CompanyProfileEnhanced;
