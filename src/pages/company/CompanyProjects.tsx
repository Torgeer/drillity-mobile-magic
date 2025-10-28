import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, MapPin, Trash2, Edit, ExternalLink } from "lucide-react";
import { getCurrentLocation, requestLocationPermission } from "@/utils/capacitorPlugins";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  project_name: string;
  type_of_works: string;
  site_manager_name: string;
  first_aider_name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  additional_info: string | null;
  notes: string | null;
  company_id: string;
  created_at: string;
  company_profiles: {
    company_name: string;
  };
}

const CompanyProjects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [submitFormOpen, setSubmitFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    project_name: "",
    type_of_works: "",
    site_manager_name: "",
    first_aider_name: "",
    location: "",
    latitude: "",
    longitude: "",
    additional_info: "",
    notes: "",
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
      .select('*, company_profiles(company_name)')
      .eq('company_id', compId)
      .order('created_at', { ascending: false });

    if (data) {
      setProjects(data as Project[]);
    }
  };

  const handleLocationDetect = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      try {
        const location = await getCurrentLocation();
        setFormData({
          ...formData,
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
        });
        toast.success("Location detected successfully!");
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
      const projectData = {
        company_id: companyId,
        project_name: formData.project_name,
        type_of_works: formData.type_of_works,
        site_manager_name: formData.site_manager_name,
        first_aider_name: formData.first_aider_name,
        location: formData.location,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        additional_info: formData.additional_info || null,
        notes: formData.notes || null,
      };

      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);

        if (error) throw error;
        toast.success("Project updated successfully!");
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([projectData]);

        if (error) throw error;
        toast.success("Project submitted successfully!");
      }

      // Reset form
      setFormData({
        project_name: "",
        type_of_works: "",
        site_manager_name: "",
        first_aider_name: "",
        location: "",
        latitude: "",
        longitude: "",
        additional_info: "",
        notes: "",
      });
      setEditingProject(null);
      setSubmitFormOpen(false);
      if (companyId) fetchProjects(companyId);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit project");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      project_name: project.project_name,
      type_of_works: project.type_of_works,
      site_manager_name: project.site_manager_name,
      first_aider_name: project.first_aider_name,
      location: project.location,
      latitude: project.latitude?.toString() || "",
      longitude: project.longitude?.toString() || "",
      additional_info: project.additional_info || "",
      notes: project.notes || "",
    });
    setSubmitFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteProjectId) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', deleteProjectId);

      if (error) throw error;

      toast.success("Project deleted successfully!");
      if (companyId) fetchProjects(companyId);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
    } finally {
      setDeleteProjectId(null);
    }
  };

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <CompanyLayout>
      <div className="w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your company projects</p>
        </div>

        {/* Submit Project Collapsible */}
        <Collapsible open={submitFormOpen} onOpenChange={setSubmitFormOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="default" className="w-full md:w-auto">
              {editingProject ? "Edit Project" : "Submit a Project"}
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${submitFormOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <form onSubmit={handleSubmit}>
              <Card className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="project_name">Project Name</Label>
                      <Input
                        id="project_name"
                        value={formData.project_name}
                        onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                        placeholder="North Sea Drilling Project"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="type_of_works">Type of Works</Label>
                      <Input
                        id="type_of_works"
                        value={formData.type_of_works}
                        onChange={(e) => setFormData({ ...formData, type_of_works: e.target.value })}
                        placeholder="Offshore Drilling"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="site_manager_name">Site Manager / Supervisor Name</Label>
                      <Input
                        id="site_manager_name"
                        value={formData.site_manager_name}
                        onChange={(e) => setFormData({ ...formData, site_manager_name: e.target.value })}
                        placeholder="John Smith"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="first_aider_name">First Aider / Health & Safety Supervisor</Label>
                      <Input
                        id="first_aider_name"
                        value={formData.first_aider_name}
                        onChange={(e) => setFormData({ ...formData, first_aider_name: e.target.value })}
                        placeholder="Jane Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="flex gap-2">
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Aberdeen, Scotland"
                        required
                      />
                      <Button type="button" variant="outline" onClick={handleLocationDetect}>
                        Detect
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude (Optional)</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        placeholder="57.1497"
                      />
                    </div>

                    <div>
                      <Label htmlFor="longitude">Longitude (Optional)</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        placeholder="-2.0943"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="additional_info">Additional Information</Label>
                    <Textarea
                      id="additional_info"
                      value={formData.additional_info}
                      onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                      placeholder="Provide any additional details about the project..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Internal notes for your team..."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingProject ? "Update Project" : "Submit Project"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setSubmitFormOpen(false);
                      setEditingProject(null);
                      setFormData({
                        project_name: "",
                        type_of_works: "",
                        site_manager_name: "",
                        first_aider_name: "",
                        location: "",
                        latitude: "",
                        longitude: "",
                        additional_info: "",
                        notes: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </form>
          </CollapsibleContent>
        </Collapsible>

        {/* Projects List */}
        <div className="grid gap-4">
          {projects.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No projects yet. Submit your first project above!</p>
            </Card>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{project.project_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {project.company_profiles.company_name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(project)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setDeleteProjectId(project.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Type of Works</p>
                      <p className="text-sm text-muted-foreground">{project.type_of_works}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Site Manager</p>
                      <p className="text-sm text-muted-foreground">{project.site_manager_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">First Aider / H&S</p>
                      <p className="text-sm text-muted-foreground">{project.first_aider_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {project.location}
                      </p>
                    </div>
                  </div>

                  {project.additional_info && (
                    <div>
                      <p className="text-sm font-medium mb-2">Additional Information</p>
                      <Card className="p-3 bg-muted/50">
                        <p className="text-sm">{project.additional_info}</p>
                      </Card>
                    </div>
                  )}

                  {project.notes && (
                    <div>
                      <p className="text-sm font-medium mb-2">Notes</p>
                      <Card className="p-3 bg-muted/50">
                        <p className="text-sm">{project.notes}</p>
                      </Card>
                    </div>
                  )}

                  {project.latitude && project.longitude && (
                    <div>
                      <p className="text-sm font-medium mb-2">Location Map</p>
                      <Card className="p-2 bg-muted/50">
                        <div className="relative">
                          <iframe
                            width="100%"
                            height="200"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${project.latitude},${project.longitude}`}
                            allowFullScreen
                            className="rounded"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => openInMaps(project.latitude!, project.longitude!)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open in Maps
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Coordinates: {project.latitude}, {project.longitude}
                        </p>
                      </Card>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
              All jobs linked to this project will no longer be associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CompanyLayout>
  );
};

export default CompanyProjects;
