import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, Theme } from "@/hooks/useTheme";
import { LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Create default preferences
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            email_notifications: true,
            push_notifications: true,
            language: 'en'
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        setPreferences(newPrefs);
      } else {
        setPreferences(data);
      }
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: string, value: any) => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setPreferences((prev: any) => ({ ...prev, [key]: value }));
      toast.success("Preference updated");
    } catch (error: any) {
      console.error('Error updating preference:', error);
      toast.error("Failed to update preference");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: passwordForm.newPassword 
      });
      
      if (error) throw error;
      
      toast.success("Password updated successfully");
      setShowPasswordDialog(false);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // This would require backend implementation
    toast.error("Account deletion requires contacting support");
    setShowDeleteDialog(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading || !preferences) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Customize your Drillity experience</p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <p className="mt-1 text-muted-foreground">{user?.email}</p>
            </div>
            
            <Button onClick={() => setShowPasswordDialog(true)}>
              Change Password
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates about applications and messages</p>
              </div>
              <Switch 
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get instant alerts on your device</p>
              </div>
              <Switch 
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
                disabled={saving}
              />
            </div>

            <div>
              <Label>Language</Label>
              <Select 
                value={preferences.language} 
                onValueChange={(value) => updatePreference('language', value)}
                disabled={saving}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sv">Svenska</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Theme</Label>
              <Select 
                value={theme}
                onValueChange={(value) => setTheme(value as Theme)}
                disabled={saving}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="gray">Gray</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h2>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete Account
          </Button>
        </Card>

        {/* Password Change Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your new password below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)} disabled={passwordLoading}>
                Cancel
              </Button>
              <Button onClick={handlePasswordChange} disabled={passwordLoading}>
                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Account Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Settings;
