import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  image?: string;
}

const CompanyProfile = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "John Smith",
      role: "HR Manager",
      email: "john@drillity.com",
      phone: "+46 70 123 4567",
      image: ""
    }
  ]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<Omit<TeamMember, "id">>({
    name: "",
    role: "",
    email: "",
    phone: "",
    image: ""
  });

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/auth");
      else if (userType === 'talent') navigate("/profile");
    }
  }, [user, userType, loading, navigate]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
        toast.success("Company logo uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMemberImageUpload = (e: React.ChangeEvent<HTMLInputElement>, memberId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (memberId) {
          setTeamMembers(prev => prev.map(m => 
            m.id === memberId ? { ...m, image: reader.result as string } : m
          ));
        } else {
          setNewMember(prev => ({ ...prev, image: reader.result as string }));
        }
        toast.success("Image uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.role || !newMember.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    setTeamMembers(prev => [...prev, { ...newMember, id: Date.now().toString() }]);
    setNewMember({ name: "", role: "", email: "", phone: "", image: "" });
    setShowAddMember(false);
    toast.success("Team member added!");
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    toast.success("Team member removed");
  };

  if (loading) {
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Company Profile</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage your company information</p>
          </div>
        </div>

        <Card className="ad-card">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Company Logo</h3>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Company Logo" className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-lg" />
              ) : (
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-lg bg-primary/20 flex items-center justify-center text-3xl sm:text-4xl font-bold text-primary">
                  D
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <Upload className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
            <div className="flex-1 text-center sm:text-left w-full">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Drillity AB</h2>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base break-all sm:break-normal">info@drillity.com</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="outline">Hiring</Badge>
                <Badge variant="outline">Oil & Gas</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="ad-card">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
            <h3 className="text-lg sm:text-xl font-semibold">Team Members</h3>
            <Button onClick={() => setShowAddMember(!showAddMember)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>

          {showAddMember && (
            <Card className="p-4 mb-4 bg-secondary/50">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    {newMember.image ? (
                      <img src={newMember.image} alt="Member" className="h-20 w-20 object-cover rounded-full" />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl font-bold text-muted-foreground">?</span>
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                      <Upload className="h-3 w-3" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMemberImageUpload(e)} />
                    </label>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name *</Label>
                      <Input value={newMember.name} onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))} placeholder="Full name" />
                    </div>
                    <div>
                      <Label>Role *</Label>
                      <Input value={newMember.role} onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))} placeholder="Job title" />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input value={newMember.email} onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))} placeholder="email@company.com" type="email" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={newMember.phone} onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))} placeholder="+46 70 123 4567" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowAddMember(false); setNewMember({ name: "", role: "", email: "", phone: "", image: "" }); }}>Cancel</Button>
                  <Button onClick={handleAddMember}>Add Member</Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {teamMembers.map((member) => (
              <Card key={member.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative group">
                    {member.image ? (
                      <img src={member.image} alt={member.name} className="h-16 w-16 object-cover rounded-full" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold text-primary">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload className="h-4 w-4 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMemberImageUpload(e, member.id)} />
                    </label>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>📧 {member.email}</p>
                      {member.phone && <p>📱 {member.phone}</p>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="ad-card">
          <h3 className="text-xl font-semibold mb-4">About</h3>
          <p className="text-muted-foreground">Add a description of your company, mission and culture.</p>
        </Card>
      </div>
    </CompanyLayout>
  );
};

export default CompanyProfile;
