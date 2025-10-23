import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { getCurrentLocation, requestLocationPermission } from "@/utils/capacitorPlugins";
import { toast } from "sonner";

interface LocationJobSearchProps {
  onLocationFound: (lat: number, lng: number) => void;
}

export const LocationJobSearch = ({ onLocationFound }: LocationJobSearchProps) => {
  const [loading, setLoading] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);

  const detectLocation = async () => {
    setLoading(true);
    
    try {
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        toast.error("Location permission denied");
        return;
      }

      const location = await getCurrentLocation();
      onLocationFound(location.latitude, location.longitude);
      setHasLocation(true);
      toast.success("Location detected - showing nearby jobs");
    } catch (error) {
      console.error("Location error:", error);
      toast.error("Could not detect location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={hasLocation ? "default" : "outline"}
      onClick={detectLocation}
      disabled={loading}
      className="flex items-center gap-2"
    >
      <MapPin className="h-4 w-4" />
      {loading ? "Detecting..." : hasLocation ? "Near Me" : "Find Jobs Near Me"}
    </Button>
  );
};
