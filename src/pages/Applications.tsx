import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const applications = [
  {
    id: 1,
    position: "Drilling Safety Inspector",
    company: "Safety First Drilling",
    status: "OFFERED",
    type: "CONTRACT",
    location: "Remote",
    salary: "$120/hour",
    appliedDate: "7 months ago",
    statusColor: "success",
  },
  {
    id: 2,
    position: "Drilling Consultant",
    company: "North Sea Operations",
    status: "INTERVIEWING",
    type: "CONTRACT",
    location: "Aberdeen, UK",
    salary: "$150/hour",
    appliedDate: "7 months ago",
    statusColor: "warning",
  },
];

const Applications = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Applications</h1>
            <p className="text-muted-foreground">Track and manage your job and contract applications</p>
          </div>
          <Button>Browse Jobs</Button>
        </div>

        <div className="flex gap-4 border-b border-border">
          <button className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary">
            All Applications (5)
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Status: All Types
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Type: All Types
          </button>
        </div>

        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-secondary">{app.type}</Badge>
                    <Badge 
                      className={
                        app.statusColor === "success" 
                          ? "bg-success/20 text-success hover:bg-success/30" 
                          : "bg-warning/20 text-warning hover:bg-warning/30"
                      }
                    >
                      {app.status}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-semibold mb-1">{app.position}</h3>
                  <p className="text-muted-foreground mb-3">{app.company}</p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>{app.location}</span>
                    <span>{app.salary}</span>
                  </div>

                  {app.status === "OFFERED" && (
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                      <p className="text-sm text-success">
                        <strong>Offer:</strong> Congratulations! We would like to offer you this position. Please respond by December 20th.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm">Accept Offer</Button>
                        <Button size="sm" variant="outline">Decline</Button>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">Applied {app.appliedDate}</p>
                </div>

                <div className="ml-4">
                  {app.status !== "OFFERED" && <Button variant="outline" size="sm">Withdraw</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Applications;
