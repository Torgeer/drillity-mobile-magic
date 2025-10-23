import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Upload, Plus, X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import drillityLogo from "@/assets/drillity-logo.png";

interface ContactPerson {
  id: string;
  full_name: string;
  role: string;
  email: string;
  phone: string;
  avatar_url?: string;
}

const CompanyOnboarding = () => {
  const { user, userType, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [companyId, setCompanyId] = useState<string>("");

  // Company data
  const [logoUrl, setLogoUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  // Sectors
  const [sectors, setSectors] = useState({
    foundation: false,
    offshore: false,
    mining: false,
    prospecting: false,
    infrastructure: false,
  });

  // Contacts
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    full_name: "",
    role: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (userType === 'talent') navigate("/dashboard");
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

      if (error) throw error;

      setCompanyId(data.id);

      // Check if onboarding is already completed
      if (data.onboarding_completed) {
        navigate("/company/dashboard");
        return;
      }

      // Pre-fill existing data if any
      if (data.company_name) setCompanyName(data.company_name);
      if (data.logo_url) setLogoUrl(data.logo_url);
      if (data.industry) setIndustry(data.industry);
      if (data.company_size) setCompanySize(data.company_size);
      if (data.location) setLocation(data.location);
      if (data.website) setWebsite(data.website);
      if (data.description) setDescription(data.description);

      setSectors({
        foundation: data.foundation_sector || false,
        offshore: data.offshore_sector || false,
        mining: data.mining_sector || false,
        prospecting: data.prospecting_sector || false,
        infrastructure: data.infrastructure_sector || false,
      });
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
      const fileName = `${companyId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      toast.success("Logo uploaded!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddContact = () => {
    if (!newContact.full_name || !newContact.role) {
      toast.error("Name and role are required");
      return;
    }
    setContacts([
      ...contacts,
      { ...newContact, id: `temp-${Date.now()}` },
    ]);
    setNewContact({ full_name: "", role: "", email: "", phone: "" });
    setShowAddContact(false);
    toast.success("Contact added!");
  };

  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  const handleNext = () => {
    if (step === 1 && !companyName) {
      toast.error("Company name is required");
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Update company profile
      const { error: profileError } = await supabase
        .from("company_profiles")
        .update({
          company_name: companyName,
          logo_url: logoUrl,
          industry: industry,
          company_size: companySize,
          location: location,
          website: website,
          description: description,
          foundation_sector: sectors.foundation,
          offshore_sector: sectors.offshore,
          mining_sector: sectors.mining,
          prospecting_sector: sectors.prospecting,
          infrastructure_sector: sectors.infrastructure,
          onboarding_completed: true,
        })
        .eq("id", companyId);

      if (profileError) throw profileError;

      // Save contacts
      if (contacts.length > 0) {
        const contactsToInsert = contacts.map((c) => ({
          company_id: companyId,
          full_name: c.full_name,
          role: c.role,
          email: c.email,
          phone: c.phone,
        }));

        const { error: contactsError } = await supabase
          .from("company_contacts")
          .insert(contactsToInsert);

        if (contactsError) throw contactsError;
      }

      toast.success("Company profile completed!");
      navigate("/company/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to save company profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center gap-4">
          <img src={drillityLogo} alt="Drillity" className="h-12" />
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome to Drillity!</h1>
            <p className="text-muted-foreground mt-2">Let's set up your company profile</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-8 flex justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Card className="p-6 sm:p-8">
          {/* Step 1: Company Info + Logo */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Company Information</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Tell us about your company
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Company Logo"
                      className="h-32 w-32 object-cover rounded-lg border-4 border-primary/20"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-lg bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary border-4 border-primary/20">
                      {companyName?.charAt(0) || "?"}
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

              <div className="space-y-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corporation"
                  />
                </div>

                <div>
                  <Label>Industry</Label>
                  <Input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Oil & Gas, Mining, Construction"
                  />
                </div>

                <div>
                  <Label>Company Size</Label>
                  <Input
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    placeholder="e.g. 1-10, 11-50, 51-200, 201-500, 500+"
                  />
                </div>

                <div>
                  <Label>Location</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <Label>Website</Label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Description */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">About Your Company</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Tell talents about your company, mission and culture
                </p>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your company, what you do, your values..."
                  rows={10}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Step 3: Sectors */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Industry Sectors</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Select the sectors your company operates in
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="foundation"
                    checked={sectors.foundation}
                    onCheckedChange={(checked) =>
                      setSectors({ ...sectors, foundation: checked as boolean })
                    }
                  />
                  <Label htmlFor="foundation" className="text-lg font-normal cursor-pointer">
                    Foundation
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="offshore"
                    checked={sectors.offshore}
                    onCheckedChange={(checked) =>
                      setSectors({ ...sectors, offshore: checked as boolean })
                    }
                  />
                  <Label htmlFor="offshore" className="text-lg font-normal cursor-pointer">
                    Offshore
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="mining"
                    checked={sectors.mining}
                    onCheckedChange={(checked) =>
                      setSectors({ ...sectors, mining: checked as boolean })
                    }
                  />
                  <Label htmlFor="mining" className="text-lg font-normal cursor-pointer">
                    Mining
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="prospecting"
                    checked={sectors.prospecting}
                    onCheckedChange={(checked) =>
                      setSectors({ ...sectors, prospecting: checked as boolean })
                    }
                  />
                  <Label htmlFor="prospecting" className="text-lg font-normal cursor-pointer">
                    Prospecting
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="infrastructure"
                    checked={sectors.infrastructure}
                    onCheckedChange={(checked) =>
                      setSectors({ ...sectors, infrastructure: checked as boolean })
                    }
                  />
                  <Label htmlFor="infrastructure" className="text-lg font-normal cursor-pointer">
                    Infrastructure
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Contact Persons */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Contact Persons</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Add people talents can contact
                </p>
              </div>

              <Button
                onClick={() => setShowAddContact(!showAddContact)}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact Person
              </Button>

              {showAddContact && (
                <Card className="p-4 bg-secondary/50">
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name *</Label>
                      <Input
                        value={newContact.full_name}
                        onChange={(e) =>
                          setNewContact({ ...newContact, full_name: e.target.value })
                        }
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label>Role *</Label>
                      <Input
                        value={newContact.role}
                        onChange={(e) =>
                          setNewContact({ ...newContact, role: e.target.value })
                        }
                        placeholder="HR Manager"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={newContact.email}
                        onChange={(e) =>
                          setNewContact({ ...newContact, email: e.target.value })
                        }
                        placeholder="john@company.com"
                        type="email"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={newContact.phone}
                        onChange={(e) =>
                          setNewContact({ ...newContact, phone: e.target.value })
                        }
                        placeholder="+46 70 123 4567"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddContact} className="flex-1">
                        Add
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddContact(false);
                          setNewContact({
                            full_name: "",
                            role: "",
                            email: "",
                            phone: "",
                          });
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {contacts.length > 0 && (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <Card key={contact.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{contact.full_name}</p>
                          <p className="text-sm text-muted-foreground">{contact.role}</p>
                          {contact.email && (
                            <p className="text-sm text-muted-foreground">📧 {contact.email}</p>
                          )}
                          {contact.phone && (
                            <p className="text-sm text-muted-foreground">📱 {contact.phone}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveContact(contact.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {contacts.length === 0 && !showAddContact && (
                <p className="text-center text-muted-foreground py-8">
                  No contact persons added yet. You can skip this step.
                </p>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button onClick={handleNext} className="flex-1">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompanyOnboarding;
