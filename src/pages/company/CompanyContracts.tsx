import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Eye, Trash2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Contract {
  id: string;
  title: string;
  description: string;
  location: string;
  equipment_needed: string | null;
  duration: string | null;
  start_date: string | null;
  budget_range: string | null;
  status: string;
  created_at: string;
  response_count?: number;
}

export default function CompanyContracts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [viewingResponses, setViewingResponses] = useState<string | null>(null);
  const [responses, setResponses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    equipment_needed: "",
    duration: "",
    start_date: "",
    budget_range: "",
  });

  useEffect(() => {
    if (user) {
      fetchCompanyId();
    }
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchContracts();
    }
  }, [companyId]);

  const fetchCompanyId = async () => {
    const { data, error } = await supabase
      .from("company_profiles")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (data && !error) {
      setCompanyId(data.id);
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        *,
        contract_responses(count)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load contracts",
        variant: "destructive",
      });
    } else {
      setContracts(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    const { error } = await supabase.from("contracts").insert({
      company_id: companyId,
      ...formData,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create contract",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Contract posted successfully",
      });
      setIsCreating(false);
      setFormData({
        title: "",
        description: "",
        location: "",
        equipment_needed: "",
        duration: "",
        start_date: "",
        budget_range: "",
      });
      fetchContracts();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contracts").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete contract",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Contract deleted",
      });
      fetchContracts();
    }
  };

  const fetchResponses = async (contractId: string) => {
    const { data, error } = await supabase
      .from("contract_responses")
      .select(`
        *,
        company_profiles!contract_responses_company_id_fkey(company_name, logo_url)
      `)
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false });

    if (!error) {
      setResponses(data || []);
      setViewingResponses(contractId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Contracts</h1>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Post New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post New Contract</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Drilling Contract - Copenhagen Project"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what you need help with..."
                  rows={6}
                />
              </div>
              <div>
                <Label>Location *</Label>
                <Input
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Copenhagen, Denmark"
                />
              </div>
              <div>
                <Label>Equipment Needed</Label>
                <Input
                  value={formData.equipment_needed}
                  onChange={(e) => setFormData({ ...formData, equipment_needed: e.target.value })}
                  placeholder="e.g., Klemm 806-5g with tophammer"
                />
              </div>
              <div>
                <Label>Duration</Label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 2 months"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Budget Range</Label>
                <Input
                  value={formData.budget_range}
                  onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                  placeholder="e.g., €50,000 - €100,000"
                />
              </div>
              <Button type="submit" className="w-full">Post Contract</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {contracts.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No contracts posted yet</p>
          </Card>
        ) : (
          contracts.map((contract) => (
            <Card key={contract.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{contract.title}</h3>
                  <Badge variant={contract.status === "open" ? "default" : "secondary"}>
                    {contract.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchResponses(contract.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Responses ({contract.response_count || 0})
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(contract.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Location:</strong> {contract.location}</p>
                {contract.equipment_needed && (
                  <p><strong>Equipment:</strong> {contract.equipment_needed}</p>
                )}
                {contract.duration && (
                  <p><strong>Duration:</strong> {contract.duration}</p>
                )}
                {contract.start_date && (
                  <p><strong>Start:</strong> {new Date(contract.start_date).toLocaleDateString()}</p>
                )}
                {contract.budget_range && (
                  <p><strong>Budget:</strong> {contract.budget_range}</p>
                )}
                <p className="mt-4">{contract.description}</p>
              </div>
            </Card>
          ))
        )}
      </div>

      {viewingResponses && (
        <Dialog open={!!viewingResponses} onOpenChange={() => setViewingResponses(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contract Responses</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {responses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No responses yet</p>
              ) : (
                responses.map((response) => (
                  <Card key={response.id} className="p-4">
                    <div className="flex items-start gap-4">
                      {response.company_profiles?.logo_url && (
                        <img
                          src={response.company_profiles.logo_url}
                          alt="Company logo"
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">
                          {response.company_profiles?.company_name || "Company"}
                        </h4>
                        {response.price_offer && (
                          <p className="text-sm font-medium text-primary mb-2">
                            Offer: {response.price_offer}
                          </p>
                        )}
                        <p className="text-sm">{response.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(response.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
