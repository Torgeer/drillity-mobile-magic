import { useState, useEffect } from "react";
import { CompanyLayout } from "@/components/CompanyLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Briefcase } from "lucide-react";
import { toast } from "sonner";

export default function BrowseTalent() {
  const navigate = useNavigate();
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    experience_level: '',
    availability: 'all',
    open_to_international: false,
  });

  const fetchTalents = async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('profiles')
        .select(`
          *,
          talent_skills(skill_name, skill_level),
          talent_certifications(certification_name, expiry_date)
        `)
        .eq('user_type', 'talent')
        .eq('profile_visibility', 'public');

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.availability && filters.availability !== 'all') {
        query = query.eq('availability_status', filters.availability);
      }
      if (filters.open_to_international) {
        query = query.eq('open_to_international', true);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setTalents(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch talents: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalents();
  }, []);

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Browse Talent</h1>
          <p className="text-muted-foreground">Search and connect with skilled professionals</p>
        </div>

        <Card className="p-6">
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location"
                placeholder="City or country" 
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Select 
                value={filters.availability}
                onValueChange={(val) => setFilters({...filters, availability: val})}
              >
                <SelectTrigger id="availability">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="available">Available Now</SelectItem>
                  <SelectItem value="2weeks">Available in 2 weeks</SelectItem>
                  <SelectItem value="1month">Available in 1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="international"
                  checked={filters.open_to_international}
                  onCheckedChange={(checked) => 
                    setFilters({...filters, open_to_international: checked as boolean})
                  }
                />
                <Label htmlFor="international">Open to International</Label>
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchTalents} className="w-full" disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {talents.map(talent => (
            <Card key={talent.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={talent.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {talent.full_name?.[0] || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{talent.full_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {talent.location || 'Location not specified'}
                    </p>
                    {talent.experience_years && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Briefcase className="h-3 w-3" />
                        {talent.experience_years}+ years experience
                      </p>
                    )}
                  </div>
                </div>

                {talent.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {talent.bio}
                  </p>
                )}

                {talent.talent_skills && talent.talent_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {talent.talent_skills.slice(0, 4).map((skill: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill.skill_name}
                      </Badge>
                    ))}
                    {talent.talent_skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{talent.talent_skills.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}

                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/company/talent/${talent.id}`)}
                >
                  View Profile
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {talents.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No talents found matching your criteria</p>
            <Button onClick={fetchTalents} variant="outline" className="mt-4">
              Reset Filters
            </Button>
          </Card>
        )}
      </div>
    </CompanyLayout>
  );
}
