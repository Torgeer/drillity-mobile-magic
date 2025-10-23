import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, Theme } from "@/hooks/useTheme";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDisplaySettings, SizeOption } from "@/hooks/useDisplaySettings";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { textScale, setTextScale, adSize, setAdSize } = useDisplaySettings();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Customize your Drillity experience</p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-primary">Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <Label className="text-primary">Email</Label>
              <p className="mt-1">{user?.email}</p>
            </div>
            
            <Button className="mt-4">Change Password</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-primary">Preferences</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-primary">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates about applications and messages</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div>
              <Label className="text-primary">Language</Label>
              <select className="mt-2 w-full rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option>English</option>
                <option>Svenska</option>
                <option>Deutsch</option>
              </select>
            </div>

            <div>
              <Label className="text-primary">Theme</Label>
              <select 
                className="mt-2 w-full rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
              >
                <option value="dark">Dark</option>
                <option value="gray">Gray</option>
                <option value="light">Light</option>
              </select>
            </div>

            <div>
              <Label className="text-primary">Textstorlek</Label>
              <select
                className="mt-2 w-full rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={textScale}
                onChange={(e) => setTextScale(e.target.value as SizeOption)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="big">Big</option>
              </select>
            </div>

            <div>
              <Label className="text-primary">Annons-/liststorlek</Label>
              <select
                className="mt-2 w-full rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={adSize}
                onChange={(e) => setAdSize(e.target.value as SizeOption)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="big">Big</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-primary">Advanced Settings</h2>
          <p className="text-muted-foreground">More settings coming soon...</p>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
