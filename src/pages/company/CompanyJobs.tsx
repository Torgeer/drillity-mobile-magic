import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const jobs = [
  {
    id: 1,
    title: "Senior Drilling Engineer",
    location: "Houston, TX",
    type: "full_time",
    applications: 18,
    salary: "$120,000",
    isActive: true,
  },
  {
    id: 2,
    title: "Rig Safety Supervisor",
    location: "Texas",
    type: "contract",
    applications: 12,
    salary: "$90/hr",
    isActive: true,
  },
  {
    id: 3,
    title: "Directional Driller",
    location: "North Sea",
    type: "rotation",
    applications: 15,
    salary: "$150,000",
    isActive: false,
  },
];

const CompanyJobs = () => {
  const navigate = useNavigate();

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => navigate('/company/jobs/new')} className="w-full sm:w-auto">
            Post New Job
          </Button>
        </div>

        <div className="flex gap-4 border-b border-border pb-2">
          <button className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary">
            All Jobs ({jobs.length})
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Active ({jobs.filter(j => j.isActive).length})
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Inactive ({jobs.filter(j => !j.isActive).length})
          </button>
        </div>

        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="ad-card hover:border-primary/50 transition-colors">
              <div className="flex flex-col gap-4 w-full min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={job.isActive ? "default" : "secondary"}>
                      {job.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="bg-secondary">
                      {job.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-primary mb-1">{job.title}</h3>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3 min-w-0">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {job.applications} applications
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => navigate(`/company/applications?job=${job.id}`)} className="w-full sm:w-auto">
                      View Applications
                    </Button>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">
                      Edit Job
                    </Button>
                    <Button size="sm" variant="ghost" className="w-full sm:w-auto">
                      {job.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyJobs;
