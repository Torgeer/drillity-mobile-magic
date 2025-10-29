import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Tables<"profiles">;
  onSuccess: () => void;
}

export const EditProfileDialog = ({ open, onOpenChange, profile, onSuccess }: EditProfileDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    bio: profile.bio || "",
    location: profile.location || "",
    phone: profile.phone || "",
    experience_years: profile.experience_years || 0,
    availability_status: profile.availability_status || "available",
    preferred_work_type: profile.preferred_work_type || [],
    linkedin_url: profile.linkedin_url || "",
    facebook_url: profile.facebook_url || "",
    instagram_url: profile.instagram_url || "",
  });

  useEffect(() => {
    setFormData({
      full_name: profile.full_name || "",
      bio: profile.bio || "",
      location: profile.location || "",
      phone: profile.phone || "",
      experience_years: profile.experience_years || 0,
      availability_status: profile.availability_status || "available",
      preferred_work_type: profile.preferred_work_type || [],
      linkedin_url: profile.linkedin_url || "",
      facebook_url: profile.facebook_url || "",
      instagram_url: profile.instagram_url || "",
    });
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Avatar must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
    }
  };

  const toggleWorkType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_work_type: prev.preferred_work_type.includes(type)
        ? prev.preferred_work_type.filter(t => t !== type)
        : [...prev.preferred_work_type, type]
    }));
  };

  const handleSubmit = async () => {
    if (formData.bio.length > 500) {
      toast({
        title: "Bio too long",
        description: "Bio must be less than 500 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let avatar_url = profile.avatar_url;

      // Upload avatar if new file provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-avatars')
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-avatars')
          .getPublicUrl(fileName);

        avatar_url = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          location: formData.location,
          phone: formData.phone,
          experience_years: formData.experience_years,
          availability_status: formData.availability_status,
          preferred_work_type: formData.preferred_work_type,
          linkedin_url: formData.linkedin_url,
          facebook_url: formData.facebook_url,
          instagram_url: formData.instagram_url,
          avatar_url,
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="avatar">Profile Picture</Label>
            <div className="flex items-center gap-4">
              {profile.avatar_url && (
                <img src={profile.avatar_url} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
              )}
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">{avatarFile ? avatarFile.name : "Upload new avatar"}</span>
                </div>
              </Label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG (max 5MB)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_years">Years of Experience</Label>
              <Input
                id="experience_years"
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability_status">Availability Status</Label>
            <Select value={formData.availability_status} onValueChange={(value) => setFormData({ ...formData, availability_status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="not_looking">Not Looking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Preferred Work Type</Label>
            <div className="space-y-2">
              {['full_time', 'part_time', 'contract', 'rotation'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`work-type-${type}`}
                    checked={formData.preferred_work_type.includes(type)}
                    onCheckedChange={() => toggleWorkType(type)}
                  />
                  <label htmlFor={`work-type-${type}`} className="text-sm capitalize">
                    {type.replace('_', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Social Media</Label>
            <div className="space-y-2">
              <Input
                placeholder="LinkedIn URL"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              />
              <Input
                placeholder="Facebook URL"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
              />
              <Input
                placeholder="Instagram URL"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
