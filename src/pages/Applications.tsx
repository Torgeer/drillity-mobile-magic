import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Applications = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            location,
            job_type,
            salary_min,
            salary_max,
            salary_currency,
            company_profiles (
              company_name
            )
          )
        `)
        .eq('talent_id', user?.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast.error("Failed to load applications");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'withdrawn' })
        .eq('id', applicationId);

      if (error) throw error;
      
      toast.success("Application withdrawn");
      fetchApplications();
    } catch (error: any) {
      toast.error("Failed to withdraw application");
      console.error(error);
    }
  };

  const handleAcceptOffer = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId);

      if (error) throw error;
      
      toast.success("Offer accepted! 🎉");
      fetchApplications();
    } catch (error: any) {
      toast.error("Failed to accept offer");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'offered':
        return 'bg-success/20 text-success hover:bg-success/30';
      case 'accepted':
        return 'bg-success/20 text-success hover:bg-success/30';
      case 'interviewing':
      case 'reviewing':
        return 'bg-warning/20 text-warning hover:bg-warning/30';
      case 'rejected':
      case 'withdrawn':
        return 'bg-destructive/20 text-destructive hover:bg-destructive/30';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Applications</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Track and manage your job applications</p>
          </div>
          <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
        </div>

        <div className="space-y-4">
          {applications.length === 0 ? (
            <Card className="ad-card text-center">
              <p className="text-muted-foreground mb-4">You haven't applied to any jobs yet.</p>
              <Button onClick={() => navigate('/jobs')}>Start Browsing Jobs</Button>
            </Card>
          ) : (
            applications.map((app) => {
              const job = app.jobs;
              const salaryDisplay = job?.salary_min && job?.salary_max
                ? `${job.salary_currency || '$'}${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                : 'Competitive';

              return (
                <Card key={app.id} className="ad-card">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className="bg-secondary">
                          {job?.job_type?.replace('_', ' ') || 'N/A'}
                        </Badge>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status.toUpperCase()}
                        </Badge>
                      </div>

                      <h3 className="text-lg sm:text-xl font-semibold mb-1">{job?.title || 'Job Title'}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-3">
                        {job?.company_profiles?.company_name || 'Company'}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground mb-4">
                        <span>{job?.location || 'Location not specified'}</span>
                        <span>{salaryDisplay}</span>
                      </div>

                      {app.status === 'offered' && (
                        <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                          <p className="text-sm text-success mb-3">
                            <strong>Congratulations!</strong> You've received an offer for this position.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => handleAcceptOffer(app.id)}>
                              Accept Offer
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleWithdraw(app.id)}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Applied {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>

                    {app.status !== 'offered' && app.status !== 'withdrawn' && app.status !== 'rejected' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleWithdraw(app.id)}
                        className="w-full sm:w-auto"
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Applications;
