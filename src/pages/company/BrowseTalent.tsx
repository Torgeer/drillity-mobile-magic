import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { getCurrentLocation, requestLocationPermission } from "@/utils/capacitorPlugins";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Talent {
  id: string;
  full_name: string;
  location: string;
  latitude: number;
  longitude: number;
  experience_years: number;
  availability_status: string;
  avatar_url: string;
}

const BrowseTalent = () => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocation();
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, location, latitude, longitude, experience_years, availability_status, avatar_url')
      .eq('user_type', 'talent')
      .not('full_name', 'is', null);

    if (data && !error) {
      setTalents(data as Talent[]);
    }
    setLoading(false);
  };

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
        const distA = a.latitude && a.longitude ? calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) : Infinity;
        const distB = b.latitude && b.longitude ? calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude) : Infinity;
        return distA - distB;
      })
    : talents;

  if (loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Browse Talent</h1>
            <p className="text-muted-foreground">Find qualified candidates</p>
          </div>
          {userLocation && (
            <Button 
              variant={sortByDistance ? "default" : "outline"}
              onClick={() => setSortByDistance(!sortByDistance)}
            >
              {sortByDistance ? "Sorted by Distance" : "Sort by Distance"}
            </Button>
          )}
        </div>

        <div className="flex gap-4">
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
          {talents.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No talents found</p>
            </Card>
          ) : (
            sortedTalents.map((talent) => {
              const distance = userLocation && talent.latitude && talent.longitude
                ? calculateDistance(userLocation.latitude, userLocation.longitude, talent.latitude, talent.longitude)
                : null;

              const isAvailable = talent.availability_status === 'available';

              return (
                <Card key={talent.id} className="p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {talent.avatar_url ? (
                        <img 
                          src={talent.avatar_url} 
                          alt={talent.full_name} 
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-2xl">
                          {talent.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{talent.full_name || 'Unknown'}</h3>
                          <Badge variant={isAvailable ? "default" : "secondary"}>
                            {isAvailable ? "Available" : "Not Available"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {talent.location || 'Location not set'}
                            {distance && <span className="text-primary ml-1">({distance} km away)</span>}
                          </div>
                          {talent.experience_years && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {talent.experience_years}+ years
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm">
                            View Profile
                          </Button>
                          <Button size="sm" variant="outline">
                            <Mail className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                          <Button size="sm" variant="outline">
                            Invite to Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </CompanyLayout>
  );
};

export default BrowseTalent;
