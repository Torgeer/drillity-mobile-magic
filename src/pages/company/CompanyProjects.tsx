import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, MapPin, Trash2, Edit, ExternalLink, Building } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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
  manager_phone: string | null;
  manager_email: string | null;
  project_photo_url: string | null;
  created_at: string;
  company_profiles: {
    company_name: string;
  };
}

const CompanyProjects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewProjectId = searchParams.get('view');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Array<{ id: string; company_name: string }>>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [assignedMembers, setAssignedMembers] = useState<Set<string>>(new Set());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [acceptedApplicants, setAcceptedApplicants] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    projectName: "",
    companyId: "",
    typeOfWorks: "",
    siteManagerName: "",
    firstAiderName: "",
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    additionalInfo: "",
    notes: "",
    managerPhone: "",
    managerEmail: "",
    projectPhotoUrl: "",
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
        fetchCompanies();
        fetchTeamMembers(data.id);
      }
    };
    
    getCompanyId();
  }, [user]);

  useEffect(() => {
    const fetchSingleProject = async () => {
      if (!viewProjectId) {
        setSelectedProject(null);
        return;
      }

      console.log("Fetching project with ID:", viewProjectId);

      // First check if project exists in local state
      const localProject = projects.find(p => p.id === viewProjectId);
      if (localProject) {
        console.log("Found project in local state:", localProject);
        setSelectedProject(localProject);
        fetchAcceptedApplicants(viewProjectId);
        return;
      }

      // If not in local state, fetch directly from database
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            company_profiles (
              company_name
            )
          `)
          .eq('id', viewProjectId)
          .single();

        if (error) throw error;

        if (data) {
          console.log("Fetched project from database:", data);
          setSelectedProject(data);
          fetchAcceptedApplicants(viewProjectId);
        } else {
          console.error("Project not found");
          toast.error("Project not found");
          navigate('/company/projects');
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error("Failed to load project");
        navigate('/company/projects');
      }
    };

    fetchSingleProject();
  }, [viewProjectId, projects, navigate]);

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from('company_profiles')
      .select('id, company_name')
      .order('company_name');
    
    if (data) {
      setCompanies(data);
    }
  };

  const fetchTeamMembers = async (compId: string) => {
    const { data: companyUsers } = await supabase
      .from('company_users')
      .select('user_id')
      .eq('company_id', compId);
    
    if (companyUsers && companyUsers.length > 0) {
      const userIds = companyUsers.map(u => u.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      if (profiles) {
        setTeamMembers(profiles);
      }
    }
  };

  const fetchProjects = async (compId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          company_profiles (
            company_name
          )
        `)
        .eq('company_id', compId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error("Failed to load projects");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTeamMembers = async (projectId: string) => {
    const { data } = await supabase
      .from('project_team_members')
      .select('user_id')
      .eq('project_id', projectId);
    
    if (data) {
      setAssignedMembers(new Set(data.map(m => m.user_id)));
    }
  };

  const fetchAcceptedApplicants = async (projectId: string) => {
    const { data } = await supabase
      .from('applications')
      .select(`
        *,
        profiles (
          full_name,
          email
        ),
        jobs (
          title,
          project_id
        )
      `)
      .eq('status', 'accepted')
      .eq('jobs.project_id', projectId);
    
    if (data) {
      setAcceptedApplicants(data);
    }
  };

  const toggleTeamMember = async (userId: string) => {
    if (!editingProject) return;
    
    if (assignedMembers.has(userId)) {
      await supabase
        .from('project_team_members')
        .delete()
        .eq('project_id', editingProject)
        .eq('user_id', userId);
      
      setAssignedMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      toast.success("Team member unassigned");
    } else {
      await supabase
        .from('project_team_members')
        .insert({ project_id: editingProject, user_id: userId });
      
      setAssignedMembers(prev => new Set([...prev, userId]));
      toast.success("Team member assigned");
    }
  };

  const handleLocationDetect = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      try {
        const location = await getCurrentLocation();
        setFormData({
          ...formData,
          latitude: location.latitude,
          longitude: location.longitude,
        });
        toast.success("Location detected successfully!");
      } catch (error) {
        toast.error("Could not detect location");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyId) {
      toast.error("Please select a company");
      return;
    }
    
    setLoading(true);

    try {
      const projectData = {
        company_id: formData.companyId,
        project_name: formData.projectName,
        type_of_works: formData.typeOfWorks,
        site_manager_name: formData.siteManagerName,
        first_aider_name: formData.firstAiderName,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        additional_info: formData.additionalInfo,
        notes: formData.notes,
        manager_phone: formData.managerPhone,
        manager_email: formData.managerEmail,
        project_photo_url: formData.projectPhotoUrl,
      };

      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject);

        if (error) throw error;
        toast.success("Project updated successfully!");
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([projectData]);

        if (error) throw error;
        toast.success("Project created successfully!");
      }

      setFormData({
        projectName: "",
        companyId: "",
        typeOfWorks: "",
        siteManagerName: "",
        firstAiderName: "",
        location: "",
        latitude: null,
        longitude: null,
        additionalInfo: "",
        notes: "",
        managerPhone: "",
        managerEmail: "",
        projectPhotoUrl: "",
      });
      setEditingProject(null);
      setIsFormOpen(false);
      setAssignedMembers(new Set());
      
      if (companyId) {
        fetchProjects(companyId);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${editingProject ? 'update' : 'create'} project`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setFormData({
      projectName: project.project_name,
      companyId: project.company_id,
      typeOfWorks: project.type_of_works,
      siteManagerName: project.site_manager_name,
      firstAiderName: project.first_aider_name,
      location: project.location,
      latitude: project.latitude,
      longitude: project.longitude,
      additionalInfo: project.additional_info || "",
      notes: project.notes || "",
      managerPhone: project.manager_phone || "",
      managerEmail: project.manager_email || "",
      projectPhotoUrl: project.project_photo_url || "",
    });
    setEditingProject(project.id);
    setIsFormOpen(true);
    fetchProjectTeamMembers(project.id);
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

  if (selectedProject) {
    return (
      <CompanyLayout>
        <div className="w-full max-w-6xl space-y-6">
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedProject(null);
              navigate('/company/projects');
            }}
          >
            ← Back to Projects
          </Button>

          <Card className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{selectedProject.project_name}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {selectedProject.company_profiles.company_name}
                </p>
              </div>
              <Button
                variant="outline"
                className="bg-orange-500 text-white hover:bg-orange-600"
                onClick={() => navigate(`/company/profile/${selectedProject.company_id}`)}
              >
                View Company
              </Button>
            </div>

            {selectedProject.project_photo_url && (
              <img
                src={selectedProject.project_photo_url}
                alt={selectedProject.project_name}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="font-semibold">Type of Works</Label>
                <p>{selectedProject.type_of_works}</p>
              </div>
              <div>
                <Label className="font-semibold">Site Manager</Label>
                <p>{selectedProject.site_manager_name}</p>
              </div>
              <div>
                <Label className="font-semibold">First Aider / H&S</Label>
                <p>{selectedProject.first_aider_name}</p>
              </div>
              <div>
                <Label className="font-semibold">Location</Label>
                <p className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selectedProject.location}
                </p>
              </div>
              {selectedProject.manager_phone && (
                <div>
                  <Label className="font-semibold">Manager Phone</Label>
                  <p>{selectedProject.manager_phone}</p>
                </div>
              )}
              {selectedProject.manager_email && (
                <div>
                  <Label className="font-semibold">Manager Email</Label>
                  <p>{selectedProject.manager_email}</p>
                </div>
              )}
            </div>

            {selectedProject.additional_info && (
              <div>
                <Label className="font-semibold mb-2 block">Additional Information</Label>
                <Card className="p-4 bg-muted/50">
                  <p className="whitespace-pre-wrap">{selectedProject.additional_info}</p>
                </Card>
              </div>
            )}

            {selectedProject.notes && (
              <div>
                <Label className="font-semibold mb-2 block">Notes</Label>
                <Card className="p-4 bg-muted/50">
                  <p className="whitespace-pre-wrap">{selectedProject.notes}</p>
                </Card>
              </div>
            )}

            {selectedProject.latitude && selectedProject.longitude && (
              <div>
                <Label className="font-semibold mb-2 block">Location Map</Label>
                <div className="relative rounded-lg overflow-hidden border">
                  <iframe
                    src={`https://www.google.com/maps?q=${selectedProject.latitude},${selectedProject.longitude}&output=embed`}
                    className="w-full h-64"
                    loading="lazy"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => openInMaps(selectedProject.latitude!, selectedProject.longitude!)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Maps
                  </Button>
                </div>
              </div>
            )}

            {acceptedApplicants.length > 0 && (
              <div>
                <Label className="font-semibold text-lg mb-3 block">Accepted Team Members</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {acceptedApplicants.map((app) => (
                    <Card key={app.id} className="p-4">
                      <h4 className="font-semibold">{app.profiles?.full_name || 'Unknown'}</h4>
                      <p className="text-sm text-muted-foreground">{app.profiles?.email}</p>
                      <Badge variant="secondary" className="mt-2">{app.jobs?.title}</Badge>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your company projects</p>
        </div>

        <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="default" className="w-full md:w-auto">
              {editingProject ? "Edit Project" : "Submit a Project"}
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isFormOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <form onSubmit={handleSubmit}>
              <Card className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="projectName">Project Name *</Label>
                    <Input
                      id="projectName"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      placeholder="North Sea Platform Alpha"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyId">Select Company *</Label>
                    <select
                      id="companyId"
                      value={formData.companyId}
                      onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                      className="w-full rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    >
                      <option value="">Select a company...</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.company_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="projectPhoto">Project Photo (Optional)</Label>
                    <Input
                      id="projectPhoto"
                      type="url"
                      value={formData.projectPhotoUrl}
                      onChange={(e) => setFormData({ ...formData, projectPhotoUrl: e.target.value })}
                      placeholder="https://example.com/project-photo.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="typeOfWorks">Type of Works *</Label>
                    <Input
                      id="typeOfWorks"
                      value={formData.typeOfWorks}
                      onChange={(e) => setFormData({ ...formData, typeOfWorks: e.target.value })}
                      placeholder="Offshore Drilling"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="siteManagerName">Site Manager / Supervisor *</Label>
                    <Input
                      id="siteManagerName"
                      value={formData.siteManagerName}
                      onChange={(e) => setFormData({ ...formData, siteManagerName: e.target.value })}
                      placeholder="John Smith"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="firstAiderName">First Aider / H&S Supervisor *</Label>
                    <Input
                      id="firstAiderName"
                      value={formData.firstAiderName}
                      onChange={(e) => setFormData({ ...formData, firstAiderName: e.target.value })}
                      placeholder="Jane Smith"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="managerPhone">Manager Phone</Label>
                      <Input
                        id="managerPhone"
                        type="tel"
                        value={formData.managerPhone}
                        onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>

                    <div>
                      <Label htmlFor="managerEmail">Manager Email</Label>
                      <Input
                        id="managerEmail"
                        type="email"
                        value={formData.managerEmail}
                        onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                        placeholder="manager@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Location *</Label>
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
                    <Label htmlFor="additionalInfo">Additional Information</Label>
                    <Textarea
                      id="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                      placeholder="Additional project details..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional project notes..."
                      rows={3}
                    />
                  </div>

                  {editingProject && teamMembers.length > 0 && (
                    <div>
                      <Label className="text-lg font-semibold mb-3 block">Assigned to Project</Label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {teamMembers.map((member) => (
                          <Card
                            key={member.id}
                            className={`p-3 cursor-pointer transition-all ${
                              assignedMembers.has(member.id)
                                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                : 'border-muted'
                            }`}
                            onClick={() => toggleTeamMember(member.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{member.full_name || 'Unnamed'}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {assignedMembers.has(member.id) ? (
                                  <>
                                    <span className="text-green-600 text-sm font-medium">Assigned</span>
                                    <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Unassigned</span>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingProject ? "Update Project" : "Submit Project"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingProject(null);
                      setAssignedMembers(new Set());
                      setFormData({
                        projectName: "",
                        companyId: "",
                        typeOfWorks: "",
                        siteManagerName: "",
                        firstAiderName: "",
                        location: "",
                        latitude: null,
                        longitude: null,
                        additionalInfo: "",
                        notes: "",
                        managerPhone: "",
                        managerEmail: "",
                        projectPhotoUrl: "",
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

        <div className="grid gap-4">
          {projects.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No projects yet. Submit your first project above!</p>
            </Card>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedProject(project);
                        fetchAcceptedApplicants(project.id);
                      }}
                    >
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
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {project.location}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CompanyLayout>
  );
};

export default CompanyProjects;
