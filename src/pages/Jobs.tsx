import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign } from "lucide-react";
import { LocationJobSearch } from "@/components/LocationJobSearch";
import { useState } from "react";

const jobs = [
  {
    id: 1,
    title: "Senior Drilling Engineer",
    company: "PetroWorks",
    location: "Houston, TX",
    latitude: 29.7604,
    longitude: -95.3698,
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
    latitude: 31.9686,
    longitude: -99.9018,
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
    latitude: 57.1497,
    longitude: -2.0943,
    type: "Rotation",
    salary: "$150,000",
    description: "Operate and optimize directional drilling tools for complex wells.",
    tags: ["Drilling", "IADC WellCAP"],
  },
];

const Jobs = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const handleLocationFound = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const sortedJobs = userLocation
    ? [...jobs].sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distA - distB;
      })
    : jobs;

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
          <LocationJobSearch onLocationFound={handleLocationFound} />
        </div>

        <div className="space-y-4">
          {sortedJobs.map((job) => {
            const distance = userLocation
              ? calculateDistance(userLocation.lat, userLocation.lng, job.latitude, job.longitude)
              : null;

            return (
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
                        {distance && <span className="text-primary ml-1">({distance} km away)</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {job.salary}
                      </div>
                    </div>

                    <p className="text-sm mb-3">{job.description}</p>

                    <div className="flex gap-2 mb-4">
                      {job.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <Button>Apply Now</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Jobs;
