import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CompanyProfile = () => {
  const { user, userType, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyData, setCompanyData] = useState<any>({
    id: "",
    company_name: "",
    description: "",
    website: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    industry: "",
    location: "",
    company_size: "",
    logo_url: "",
    foundation_sector: false,
    offshore_sector: false,
    mining_sector: false,
    prospecting_sector: false,
    infrastructure_sector: false,
  });

  const [editData, setEditData] = useState(companyData);
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (userType === 'talent') navigate("/profile");
      else fetchCompanyProfile();
    }
  }, [user, userType, authLoading, navigate]);

  const fetchCompanyProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, create one
          const { data: newProfile, error: createError } = await supabase
            .from("company_profiles")
            .insert({
              user_id: user.id,
              company_name: "My Company",
            })
            .select()
            .single();

          if (createError) throw createError;
          setCompanyData(newProfile);
          setEditData(newProfile);
        } else {
          throw error;
        }
      } else {
        setCompanyData(data);
        setEditData(data);

        // Fetch contacts
        try {
          const { data: contactsData, error: contactsError } = await supabase
            .from("company_contacts")
            .select("*")
            .eq("company_id", data.id)
            .order("created_at", { ascending: false });

          if (!contactsError && contactsData) {
            setContacts(contactsData);
          }
        } catch (err) {
          console.error("Error fetching contacts:", err);
          // Don't fail the whole page if contacts fail
        }
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
      toast.error("Failed to load company profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${companyData.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("company_profiles")
        .update({ logo_url: publicUrl })
        .eq("id", companyData.id);

      if (updateError) throw updateError;

      setCompanyData({ ...companyData, logo_url: publicUrl });
      setEditData({ ...editData, logo_url: publicUrl });
      toast.success("Company logo updated!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Contact person helpers
  const handleAddContact = () => {
    setContacts((prev) => [
      ...prev,
      { id: undefined, full_name: "", role: "", email: "", phone: "", company_id: companyData.id },
    ]);
  };

  const handleRemoveContact = async (index: number) => {
    const contact = contacts[index];
    try {
      if (contact?.id) {
        await supabase.from("company_contacts").delete().eq("id", contact.id);
      }
    } catch (e) {
      console.error("Error removing contact:", e);
      toast.error("Failed to remove contact");
      return;
    }
    setContacts((prev) => prev.filter((_, i) => i !== index));
    toast.success("Contact removed");
  };

  const upsertContacts = async () => {
    if (!companyData.id) return;
    const ops = contacts.map(async (c) => {
      const payload = {
        full_name: c.full_name?.trim() || null,
        role: c.role?.trim() || null,
        email: c.email?.trim() || null,
        phone: c.phone?.trim() || null,
        company_id: companyData.id,
      };
      if (c.id) {
        const { error } = await supabase.from("company_contacts").update(payload).eq("id", c.id);
        if (error) throw error;
        return c;
      } else {
        const { data, error } = await supabase
          .from("company_contacts")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    });
    const results = await Promise.all(ops);
    setContacts(results);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("company_profiles")
        .update({
          company_name: editData.company_name,
          description: editData.description,
          website: editData.website,
          contact_email: editData.contact_email,
          contact_phone: editData.contact_phone,
          address: editData.address,
          industry: editData.industry,
          location: editData.location,
          company_size: editData.company_size,
          foundation_sector: editData.foundation_sector,
          offshore_sector: editData.offshore_sector,
          mining_sector: editData.mining_sector,
          prospecting_sector: editData.prospecting_sector,
          infrastructure_sector: editData.infrastructure_sector,
        })
        .eq("id", companyData.id);

      if (error) throw error;

      // Save contacts too
      await upsertContacts();

      setCompanyData(editData);
      setIsEditing(false);
      toast.success("Company profile updated!");
    } catch (error) {
      console.error("Error updating company profile:", error);
      toast.error("Failed to update company profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CompanyLayout>
    );
  }

  if (isEditing) {
    return (
      <CompanyLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Edit Company Profile</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Update your company information</p>
            </div>
          </div>

          <Card className="ad-card">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">Company Logo</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {editData.logo_url ? (
                  <img
                    src={editData.logo_url}
                    alt="Company Logo"
                    className="h-32 w-32 object-cover rounded-lg border-4 border-primary/20"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-lg bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary border-4 border-primary/20">
                    {editData.company_name?.charAt(0) || "?"}
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
            </div>
          </Card>

          <Card className="ad-card">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">Company Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={editData.company_name || ""}
                  onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                  placeholder="Company name"
                />
              </div>

              <div>
                <Label>Industry</Label>
                <Input
                  value={editData.industry || ""}
                  onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
                  placeholder="e.g. Oil & Gas, Mining, Construction"
                />
              </div>

              <div>
                <Label>Company Size</Label>
                <Input
                  value={editData.company_size || ""}
                  onChange={(e) => setEditData({ ...editData, company_size: e.target.value })}
                  placeholder="e.g. 1-10, 11-50, 51-200, 201-500, 500+"
                />
              </div>

              <div>
                <Label>Location</Label>
                <Input
                  value={editData.location || ""}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>

              <div>
                <Label>Website</Label>
                <Input
                  value={editData.website || ""}
                  onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>

              <div>
                <Label>Contact Email</Label>
                <Input
                  value={editData.contact_email || ""}
                  onChange={(e) => setEditData({ ...editData, contact_email: e.target.value })}
                  placeholder="contact@company.com"
                  type="email"
                />
              </div>

              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={editData.contact_phone || ""}
                  onChange={(e) => setEditData({ ...editData, contact_phone: e.target.value })}
                  placeholder="+1 555 555 555"
                  type="tel"
                />
              </div>

              <div>
                <Label>Address</Label>
                <Input
                  value={editData.address || ""}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  placeholder="Street, City, Country"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editData.description || ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="Tell talents about your company, mission and culture"
                  rows={6}
                />
              </div>
            </div>
          </Card>

          <Card className="ad-card">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">Industry Sectors</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="edit-foundation"
                  checked={editData.foundation_sector}
                  onCheckedChange={(checked) =>
                    setEditData({ ...editData, foundation_sector: checked as boolean })
                  }
                />
                <Label htmlFor="edit-foundation" className="font-normal cursor-pointer">
                  Foundation
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="edit-offshore"
                  checked={editData.offshore_sector}
                  onCheckedChange={(checked) =>
                    setEditData({ ...editData, offshore_sector: checked as boolean })
                  }
                />
                <Label htmlFor="edit-offshore" className="font-normal cursor-pointer">
                  Offshore
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="edit-mining"
                  checked={editData.mining_sector}
                  onCheckedChange={(checked) =>
                    setEditData({ ...editData, mining_sector: checked as boolean })
                  }
                />
                <Label htmlFor="edit-mining" className="font-normal cursor-pointer">
                  Mining
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="edit-prospecting"
                  checked={editData.prospecting_sector}
                  onCheckedChange={(checked) =>
                    setEditData({ ...editData, prospecting_sector: checked as boolean })
                  }
                />
                <Label htmlFor="edit-prospecting" className="font-normal cursor-pointer">
                  Prospecting
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="edit-infrastructure"
                  checked={editData.infrastructure_sector}
                  onCheckedChange={(checked) =>
                    setEditData({ ...editData, infrastructure_sector: checked as boolean })
                  }
                />
                <Label htmlFor="edit-infrastructure" className="font-normal cursor-pointer">
                  Infrastructure
                </Label>
              </div>
            </div>
          </Card>

          <Card className="ad-card">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">Contact Persons</h3>
            <div className="space-y-4">
              {contacts.map((c, idx) => (
                <div key={c.id ?? idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Input
                    placeholder="Full name"
                    value={c.full_name || ""}
                    onChange={(e) => {
                      const v = e.target.value; setContacts((prev) => prev.map((it, i) => i === idx ? { ...it, full_name: v } : it));
                    }}
                  />
                  <Input
                    placeholder="Role"
                    value={c.role || ""}
                    onChange={(e) => {
                      const v = e.target.value; setContacts((prev) => prev.map((it, i) => i === idx ? { ...it, role: v } : it));
                    }}
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={c.email || ""}
                    onChange={(e) => {
                      const v = e.target.value; setContacts((prev) => prev.map((it, i) => i === idx ? { ...it, email: v } : it));
                    }}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Phone"
                      value={c.phone || ""}
                      onChange={(e) => {
                        const v = e.target.value; setContacts((prev) => prev.map((it, i) => i === idx ? { ...it, phone: v } : it));
                      }}
                    />
                    <Button type="button" variant="outline" onClick={() => handleRemoveContact(idx)}>Remove</Button>
                  </div>
                </div>
              ))}
              <div>
                <Button type="button" variant="outline" onClick={handleAddContact}>Add contact</Button>
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditData(companyData);
                setIsEditing(false);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Company Profile</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Your company information</p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        </div>

        <Card className="ad-card">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {companyData.logo_url ? (
              <img
                src={companyData.logo_url}
                alt="Company Logo"
                className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-lg border-4 border-primary/20 flex-shrink-0"
              />
            ) : (
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-lg bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary border-4 border-primary/20 flex-shrink-0">
                {companyData.company_name?.charAt(0) || "?"}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left w-full">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">
                {companyData.company_name || "Company Name"}
              </h2>
              {companyData.location && (
                <p className="text-muted-foreground mb-2 text-sm">📍 {companyData.location}</p>
              )}
              {companyData.address && (
                <p className="text-muted-foreground mb-2 text-sm">🏢 {companyData.address}</p>
              )}
              {companyData.contact_email && (
                <p className="text-muted-foreground mb-2 text-sm">📧 {companyData.contact_email}</p>
              )}
              {companyData.contact_phone && (
                <p className="text-muted-foreground mb-2 text-sm">📞 {companyData.contact_phone}</p>
              )}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
                {companyData.industry && <Badge variant="outline">{companyData.industry}</Badge>}
                {companyData.company_size && (
                  <Badge variant="outline">{companyData.company_size} employees</Badge>
                )}
              </div>
              {companyData.website && (
                <a
                  href={companyData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                >
                  <Globe className="h-4 w-4" />
                  {companyData.website}
                </a>
              )}
            </div>
          </div>
        </Card>

        {(companyData.foundation_sector ||
          companyData.offshore_sector ||
          companyData.mining_sector ||
          companyData.prospecting_sector ||
          companyData.infrastructure_sector) && (
          <Card className="ad-card">
            <h3 className="text-xl font-semibold mb-4">Industry Sectors</h3>
            <div className="flex flex-wrap gap-2">
              {companyData.foundation_sector && <Badge>Foundation</Badge>}
              {companyData.offshore_sector && <Badge>Offshore</Badge>}
              {companyData.mining_sector && <Badge>Mining</Badge>}
              {companyData.prospecting_sector && <Badge>Prospecting</Badge>}
              {companyData.infrastructure_sector && <Badge>Infrastructure</Badge>}
            </div>
          </Card>
        )}

        {contacts.length > 0 && (
          <Card className="ad-card">
            <h3 className="text-xl font-semibold mb-4">Contact Persons</h3>
            <div className="space-y-4">
              {contacts.map((contact: any) => (
                <Card key={contact.id} className="p-4 bg-secondary/50">
                  <div>
                    <p className="font-semibold">{contact.full_name}</p>
                    <p className="text-sm text-muted-foreground">{contact.role}</p>
                    {contact.email && (
                      <p className="text-sm text-muted-foreground mt-1">📧 {contact.email}</p>
                    )}
                    {contact.phone && (
                      <p className="text-sm text-muted-foreground">📱 {contact.phone}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {companyData.description && (
          <Card className="ad-card">
            <h3 className="text-xl font-semibold mb-4">About</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{companyData.description}</p>
          </Card>
        )}

        {!companyData.description && (
          <Card className="ad-card">
            <h3 className="text-xl font-semibold mb-4">About</h3>
            <p className="text-muted-foreground">
              Click "Edit Profile" to add a description of your company, mission and culture.
            </p>
          </Card>
        )}
      </div>
    </CompanyLayout>
  );
};

export default CompanyProfile;
