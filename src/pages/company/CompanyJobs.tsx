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
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">My Jobs</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Manage your job postings</p>
          </div>
          <Button onClick={() => navigate('/company/jobs/new')} className="w-full sm:w-auto">
            Post New Job
          </Button>
        </div>

        <div className="flex gap-2 sm:gap-4 border-b border-border pb-2 overflow-x-auto">
          <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 border-primary text-primary whitespace-nowrap">
            All Jobs ({jobs.length})
          </button>
          <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">
            Active ({jobs.filter(j => j.isActive).length})
          </button>
          <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">
            Inactive ({jobs.filter(j => !j.isActive).length})
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="p-4 sm:p-5 lg:p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant={job.isActive ? "default" : "secondary"} className="text-xs">
                      {job.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="bg-secondary text-xs">
                      {job.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-primary mb-1 break-words">{job.title}</h3>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{job.salary}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{job.applications} applications</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
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
              </div>
            </Card>
          ))}
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyJobs;
