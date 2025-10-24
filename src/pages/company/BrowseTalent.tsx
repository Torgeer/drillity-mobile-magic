import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { getCurrentLocation, requestLocationPermission } from "@/utils/capacitorPlugins";
import { toast } from "sonner";

const talents = [
  {
    id: 1,
    name: "Alex Driller",
    location: "Houston, TX",
    latitude: 29.7604,
    longitude: -95.3698,
    skills: ["Project Management", "Software Development", "Database Design", "Drilling Operations"],
    experience: "10+ years",
    available: true,
  },
  {
    id: 2,
    name: "Jordan Engineer",
    location: "Aberdeen, UK",
    latitude: 57.1497,
    longitude: -2.0943,
    skills: ["Drilling", "IADC WellCAP", "H2S Safety", "Offshore Operations"],
    experience: "8 years",
    available: true,
  },
  {
    id: 3,
    name: "Sam Supervisor",
    location: "Stavanger, Norway",
    latitude: 58.9700,
    longitude: 5.7331,
    skills: ["Safety Management", "OSHA 30", "Team Leadership"],
    experience: "12 years",
    available: false,
  },
];

const BrowseTalent = () => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
        toast.success("Location detected");
      } catch (error) {
        console.error("Error getting location:", error);
      }
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const sortedTalents = sortByDistance && userLocation
    ? [...talents].sort((a, b) => {
        const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
        return distA - distB;
      })
    : talents;

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex justify-end">
          {userLocation && (
            <Button 
              variant={sortByDistance ? "default" : "outline"}
              onClick={() => setSortByDistance(!sortByDistance)}
              className="w-full sm:w-auto"
            >
              {sortByDistance ? "Sorted by Distance" : "Sort by Distance"}
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search talents..."
            className="flex-1 rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select className="rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option>All Locations</option>
            <option>Houston, TX</option>
            <option>Aberdeen, UK</option>
            <option>Stavanger, Norway</option>
          </select>
          <select className="rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option>All Skills</option>
            <option>Drilling</option>
            <option>Safety</option>
            <option>Engineering</option>
          </select>
        </div>

        <div className="space-y-4">
          {sortedTalents.map((talent) => {
            const distance = userLocation 
              ? calculateDistance(userLocation.latitude, userLocation.longitude, talent.latitude, talent.longitude)
              : null;

            return (
              <Card key={talent.id} className="ad-card hover:border-primary/50 transition-colors">
                <div className="flex flex-col sm:flex-row items-start gap-4 w-full min-w-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-2xl">
                      {talent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{talent.name}</h3>
                        <Badge variant={talent.available ? "default" : "secondary"}>
                          {talent.available ? "Available" : "Not Available"}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3 min-w-0">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {talent.location}
                          {distance && <span className="text-primary ml-1">({distance} km away)</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {talent.experience}
                        </div>
                      </div>

                      <div className="mb-3">
                        <h4 className="text-sm font-medium mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {talent.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" className="w-full sm:w-auto">
                          View Profile
                        </Button>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto">
                          <Mail className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto">
                          Invite to Apply
                        </Button>
                      </div>
                    </div>
                  </div>
              </Card>
            );
          })}
        </div>
      </div>
    </CompanyLayout>
  );
};

export default BrowseTalent;
