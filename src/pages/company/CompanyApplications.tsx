import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Phone, FileText } from "lucide-react";

const applications = [
  {
    id: 1,
    talentName: "John Driller",
    jobTitle: "Senior Drilling Engineer",
    status: "pending",
    appliedDate: "2 hours ago",
    location: "Houston, TX",
    email: "john@example.com",
    phone: "+1 555 0123",
    skills: ["IADC WellCAP", "H2S", "Deepwater"],
  },
  {
    id: 2,
    talentName: "Sarah Safety",
    jobTitle: "Rig Safety Supervisor",
    status: "reviewing",
    appliedDate: "5 hours ago",
    location: "Texas",
    email: "sarah@example.com",
    phone: "+1 555 0456",
    skills: ["OSHA 30", "Equipment", "First Aid"],
  },
  {
    id: 3,
    talentName: "Mike Direction",
    jobTitle: "Directional Driller",
    status: "interviewing",
    appliedDate: "1 day ago",
    location: "Aberdeen, UK",
    email: "mike@example.com",
    phone: "+44 7700 900123",
    skills: ["Drilling", "IADC WellCAP", "Geology"],
  },
];

const CompanyApplications = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/20 text-warning';
      case 'reviewing': return 'bg-primary/20 text-primary';
      case 'interviewing': return 'bg-success/20 text-success';
      default: return 'bg-secondary';
    }
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground">Review and manage candidate applications</p>
        </div>

        <div className="flex gap-4 border-b border-border pb-2">
          <button className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary">
            All ({applications.length})
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Pending
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Reviewing
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Interviewing
          </button>
        </div>

        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="ad-card">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                    {app.talentName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{app.talentName}</h3>
                    <p className="text-sm text-muted-foreground">Applied for: {app.jobTitle}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground min-w-0">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {app.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {app.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {app.phone}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getStatusColor(app.status)}>
                    {app.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{app.appliedDate}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {app.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="bg-secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  View CV
                </Button>
                <Button size="sm" variant="outline" className="w-full sm:w-auto">
                  Schedule Interview
                </Button>
                <Button size="sm" variant="outline" className="w-full sm:w-auto">
                  Message
                </Button>
                <Button size="sm" variant="ghost" className="w-full sm:w-auto">
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyApplications;
