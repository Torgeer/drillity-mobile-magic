import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, DollarSign, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Tables, Enums } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Application = Tables<"applications"> & {
  jobs: Pick<Tables<"jobs">, "id" | "title" | "location" | "job_type" | "salary_min" | "salary_max" | "salary_currency"> & {
    company_profiles: Pick<Tables<"company_profiles">, "id" | "company_name" | "logo_url">;
  };
};

const Applications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs!inner (
            id,
            title,
            location,
            job_type,
            salary_min,
            salary_max,
            salary_currency,
            company_profiles!inner (
              id,
              company_name,
              logo_url
            )
          )
        `)
        .eq('talent_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error loading applications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Enums<"application_status">) => {
    const statusConfig: Record<Enums<"application_status">, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30', label: 'Pending' },
      reviewing: { color: 'bg-blue-500/20 text-blue-700 hover:bg-blue-500/30', label: 'Reviewing' },
      interviewing: { color: 'bg-purple-500/20 text-purple-700 hover:bg-purple-500/30', label: 'Interviewing' },
      offered: { color: 'bg-green-500/20 text-green-700 hover:bg-green-500/30', label: 'Offered' },
      rejected: { color: 'bg-red-500/20 text-red-700 hover:bg-red-500/30', label: 'Rejected' },
      withdrawn: { color: 'bg-gray-500/20 text-gray-700 hover:bg-gray-500/30', label: 'Withdrawn' },
      accepted: { color: 'bg-green-600/20 text-green-800 hover:bg-green-600/30', label: 'Accepted' }
    };
    return statusConfig[status];
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return "Not specified";
    const curr = currency || "USD";
    if (min && max) return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `From ${curr} ${min.toLocaleString()}`;
    if (max) return `Up to ${curr} ${max.toLocaleString()}`;
    return "Not specified";
  };

  const handleWithdrawClick = (appId: string) => {
    setSelectedAppId(appId);
    setWithdrawDialogOpen(true);
  };

  const handleWithdraw = async () => {
    if (!selectedAppId) return;

    setWithdrawing(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'withdrawn' })
        .eq('id', selectedAppId);

      if (error) throw error;

      toast({
        title: "Application withdrawn",
        description: "Your application has been withdrawn successfully.",
      });

      fetchApplications();
    } catch (error: any) {
      console.error('Error withdrawing application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to withdraw application",
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
      setWithdrawDialogOpen(false);
      setSelectedAppId(null);
    }
  };

  const filteredApplications = statusFilter === "all" 
    ? applications 
    : applications.filter(app => app.status === statusFilter);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Applications</h1>
            <p className="text-muted-foreground">Track and manage your job applications</p>
          </div>
          <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
        </div>

        <div className="flex gap-4 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications ({applications.length})</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="offered">Offered</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredApplications.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {statusFilter === "all" 
                ? "You haven't applied to any jobs yet"
                : `No ${statusFilter} applications`}
            </p>
            <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const statusBadge = getStatusBadge(app.status);
              const canWithdraw = app.status === 'pending' || app.status === 'reviewing';

              return (
                <Card key={app.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      {app.jobs.company_profiles.logo_url && (
                        <img 
                          src={app.jobs.company_profiles.logo_url} 
                          alt={app.jobs.company_profiles.company_name}
                          className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={statusBadge.color}>
                            {statusBadge.label}
                          </Badge>
                        </div>

                        <h3 className="text-xl font-semibold mb-1">{app.jobs.title}</h3>
                        <p className="text-muted-foreground mb-3">
                          {app.jobs.company_profiles.company_name}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{app.jobs.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatSalary(app.jobs.salary_min, app.jobs.salary_max, app.jobs.salary_currency)}</span>
                          </div>
                        </div>

                        {app.status === 'offered' && (
                          <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                            <p className="text-sm text-success mb-3">
                              <strong>Offer:</strong> Congratulations! You've been offered this position. 
                              Please respond soon.
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm">Accept Offer</Button>
                              <Button size="sm" variant="outline">Decline</Button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Applied {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      {canWithdraw && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleWithdrawClick(app.id)}
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Application?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? "Withdrawing..." : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Applications;
