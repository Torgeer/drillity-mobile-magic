import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const CompanySettings = () => {
  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company Settings</h1>
          <p className="text-muted-foreground">Manage your company preferences</p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-primary">Notification Preferences</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-primary">New Applications</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone applies</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-primary">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive mobile push notifications</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-primary">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email updates</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-primary">Company Information</h2>
          <Button>Edit Company Profile</Button>
        </Card>
      </div>
    </CompanyLayout>
  );
};

export default CompanySettings;
