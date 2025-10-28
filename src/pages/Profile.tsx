import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CVUpload } from "@/components/CVUpload";
import { useAuth } from "@/hooks/useAuth";

const Profile = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Professional profile</p>
          </div>
          <Button className="w-full sm:w-auto">Edit Profile</Button>
        </div>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl sm:text-4xl font-bold text-primary flex-shrink-0">
              A
            </div>
            <div className="flex-1 text-center sm:text-left w-full">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Alex Driller</h2>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base break-all sm:break-normal">alex.driller@gmail.com</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="outline">Available for work</Badge>
                <Badge variant="outline">Open to contracts</Badge>
              </div>
            </div>
          </div>
        </Card>

        {user && <CVUpload userId={user.id} />}

        <Card className="p-4 sm:p-5 lg:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Skills</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base">Project Management</span>
              <Badge className="bg-warning/20 text-warning text-xs flex-shrink-0">intermediate</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base">Software Development</span>
              <Badge className="bg-success/20 text-success text-xs flex-shrink-0">expert</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base">Database Design</span>
              <Badge className="bg-primary/20 text-primary text-xs flex-shrink-0">advanced</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base">Drilling Operations</span>
              <Badge className="bg-success/20 text-success text-xs flex-shrink-0">expert</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 lg:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Experience</h3>
          <p className="text-muted-foreground text-sm sm:text-base">No experience listed.</p>
        </Card>

        <Card className="p-4 sm:p-5 lg:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Certifications</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">IADC WellCAP</p>
                <p className="text-xs sm:text-sm text-muted-foreground">International Association of Drilling Contractors</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">H2S Safety</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Hydrogen Sulfide Safety Certification</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">OSHA 30</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Occupational Safety and Health Administration</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
