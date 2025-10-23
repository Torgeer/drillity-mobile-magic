import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CompanyProfile = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/auth");
      else if (userType === 'talent') navigate("/profile");
    }
  }, [user, userType, loading, navigate]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Company Profile</h1>
            <p className="text-muted-foreground">Public company information</p>
          </div>
          <Button>Edit Company Profile</Button>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
              D
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">Drillity AB</h2>
              <p className="text-muted-foreground mb-4">info@drillity.com</p>
              <div className="flex gap-2">
                <Badge variant="outline">Hiring</Badge>
                <Badge variant="outline">Oil & Gas</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">About</h3>
          <p className="text-muted-foreground">Add a description of your company, mission and culture.</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Open Roles</h3>
          <p className="text-muted-foreground">No roles listed yet.</p>
        </Card>
      </div>
    </CompanyLayout>
  );
};

export default CompanyProfile;
