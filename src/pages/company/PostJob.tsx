import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCurrentLocation, requestLocationPermission } from "@/utils/capacitorPlugins";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PostJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; project_name: string }>>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    jobType: "full_time",
    experienceLevel: "intermediate",
    salaryMin: "",
    salaryMax: "",
    remote: false,
    skills: "",
    certifications: "",
    projectId: "",
  });

  useEffect(() => {
    const getCompanyId = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setCompanyId(data.id);
        fetchProjects(data.id);
      }
    };
    
    getCompanyId();
  }, [user]);

  const fetchProjects = async (compId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, project_name')
      .eq('company_id', compId)
      .order('created_at', { ascending: false });

    if (data) {
      setProjects(data);
    }
  };

  const handleLocationDetect = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      try {
        const location = await getCurrentLocation();
        // In a real app, you'd reverse geocode this to get city/country
        toast.success(`Location detected: ${location.latitude}, ${location.longitude}`);
      } catch (error) {
        toast.error("Could not detect location");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      toast.error("Company profile not found");
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('jobs')
        .insert([{
          company_id: companyId,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          job_type: formData.jobType as 'full_time' | 'part_time' | 'contract' | 'rotation',
          experience_level: formData.experienceLevel as 'entry' | 'intermediate' | 'senior' | 'expert',
          salary_min: formData.salaryMin ? parseInt(formData.salaryMin) : null,
          salary_max: formData.salaryMax ? parseInt(formData.salaryMax) : null,
          remote: formData.remote,
          skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
          certifications: formData.certifications ? formData.certifications.split(',').map(c => c.trim()) : [],
          project_id: formData.projectId || null,
          is_active: true
        }]);

      if (error) throw error;

      toast.success("Job posted successfully!");
      navigate("/company/jobs");
    } catch (error: any) {
      toast.error(error.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CompanyLayout>
      <div className="w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Post a New Job</h1>
          <p className="text-muted-foreground">Fill in the details to create a job posting</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Drilling Engineer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={6}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Houston, TX"
                      required
                    />
                    <Button type="button" variant="outline" onClick={handleLocationDetect}>
                      Detect
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="jobType">Job Type</Label>
                  <select
                    id="jobType"
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                    className="w-full rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="rotation">Rotation</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experienceLevel">Experience Level</Label>
                  <select
                    id="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="w-full rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="senior">Senior</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div>
                  <Label>Salary Range (USD)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="projectId">Link to Project (Optional)</Label>
                <select
                  id="projectId"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">No project selected</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="skills">Required Skills (comma separated)</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="Drilling, IADC WellCAP, H2S"
                />
              </div>

              <div>
                <Label htmlFor="certifications">Required Certifications (comma separated)</Label>
                <Input
                  id="certifications"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  placeholder="IADC WellCAP, OSHA 30"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remote"
                  checked={formData.remote}
                  onChange={(e) => setFormData({ ...formData, remote: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="remote" className="cursor-pointer">
                  Remote work possible
                </Label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Posting..." : "Post Job"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/company/jobs")}>
                Cancel
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </CompanyLayout>
  );
};

export default PostJob;
