import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign } from "lucide-react";

const jobs = [
  {
    id: 1,
    title: "Senior Drilling Engineer",
    company: "PetroWorks",
    location: "Houston, TX",
    type: "Full-time",
    salary: "$120,000",
    description: "Lead drilling operations for offshore projects. Experience with deepwater rigs required.",
    tags: ["Drilling", "IADC WellCAP", "H2S"],
  },
  {
    id: 2,
    title: "Rig Safety Supervisor",
    company: "DrillSafe",
    location: "Texas",
    type: "Contract",
    salary: "$90/hr",
    description: "Oversee safety compliance and training on-site. Must have OSHA certification.",
    tags: ["Equipment", "OSHA 30"],
  },
  {
    id: 3,
    title: "Directional Driller",
    company: "GeoPath",
    location: "North Sea",
    type: "Rotation",
    salary: "$150,000",
    description: "Operate and optimize directional drilling tools for complex wells.",
    tags: ["Drilling", "IADC WellCAP"],
  },
];

const Jobs = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Browse Jobs</h1>
          <p className="text-muted-foreground">Find opportunities</p>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search jobs..."
            className="flex-1 rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select className="rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option>All Locations</option>
            <option>Houston, TX</option>
            <option>North Sea</option>
            <option>Texas</option>
          </select>
          <select className="rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option>All Types</option>
            <option>Full-time</option>
            <option>Contract</option>
            <option>Rotation</option>
          </select>
        </div>

        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {job.type}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-1">{job.title}</h3>
                  <p className="text-muted-foreground mb-3">{job.company}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </div>
                  </div>

                  <p className="text-sm mb-3">{job.description}</p>

                  <div className="flex gap-2">
                    {job.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="bg-secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="ml-4">View Details</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Jobs;
