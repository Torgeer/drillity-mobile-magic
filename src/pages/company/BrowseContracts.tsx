import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { messageSchema } from "@/lib/validationSchemas";

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
  company_profiles: {
    company_name: string;
    logo_url: string | null;
  };
}

export default function BrowseContracts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseForm, setResponseForm] = useState({
    message: "",
    price_offer: "",
  });

  useEffect(() => {
    if (user) {
      fetchCompanyId();
    }
  }, [user]);

  useEffect(() => {
    fetchContracts();
  }, []);

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
        company_profiles(company_name, logo_url)
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load contracts",
        variant: "destructive",
      });
    } else {
      setContracts(data as any || []);
    }
    setLoading(false);
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !respondingTo) return;

    // Validate input data using Zod schema
    const validationResult = messageSchema.safeParse({
      content: responseForm.message,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      const firstError = Object.values(errors.fieldErrors)[0]?.[0] || 'Validation failed';
      toast({
        title: "Validation Error",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("contract_responses").insert({
      contract_id: respondingTo,
      company_id: companyId,
      message: validationResult.data.content,
      price_offer: responseForm.price_offer || null,
    });

    if (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Your offer has been submitted",
      });
      setRespondingTo(null);
      setResponseForm({ message: "", price_offer: "" });
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Browse Contracts</h1>
        <p className="text-muted-foreground">Find drilling contracts and submit your offers</p>
      </div>

      <div className="grid gap-4">
        {contracts.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No open contracts available</p>
          </Card>
        ) : (
          contracts.map((contract) => (
            <Card key={contract.id} className="p-6 relative overflow-hidden">
              {/* Drillity Watermark */}
              <div className="absolute top-4 right-4 opacity-10 dark:opacity-5 pointer-events-none">
                <div className="text-6xl font-bold text-primary transform rotate-12">DRILLITY</div>
              </div>
              <div className="absolute bottom-4 left-4 opacity-10 dark:opacity-5 pointer-events-none">
                <div className="text-4xl font-bold text-primary">DRILLITY</div>
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {contract.company_profiles?.logo_url && (
                        <img
                          src={contract.company_profiles.logo_url}
                          alt="Company logo"
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-xl font-semibold">{contract.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {contract.company_profiles?.company_name}
                        </p>
                      </div>
                    </div>
                    <Badge>Open</Badge>
                  </div>
                  <Dialog open={respondingTo === contract.id} onOpenChange={(open) => !open && setRespondingTo(null)}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setRespondingTo(contract.id)}>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Offer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Submit Your Offer</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmitResponse} className="space-y-4">
                        <div>
                          <Label>Your Offer/Message *</Label>
                          <Textarea
                            required
                            value={responseForm.message}
                            onChange={(e) => setResponseForm({ ...responseForm, message: e.target.value })}
                            placeholder="Describe your offer, capabilities, and why you're the right fit..."
                            rows={6}
                          />
                        </div>
                        <div>
                          <Label>Price Offer (Optional)</Label>
                          <Input
                            value={responseForm.price_offer}
                            onChange={(e) => setResponseForm({ ...responseForm, price_offer: e.target.value })}
                            placeholder="e.g., €75,000"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Submit Offer
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-2 text-sm bg-background/50 p-4 rounded-lg">
                  <p><strong>Location:</strong> {contract.location}</p>
                  {contract.equipment_needed && (
                    <p><strong>Equipment:</strong> {contract.equipment_needed}</p>
                  )}
                  {contract.duration && (
                    <p><strong>Duration:</strong> {contract.duration}</p>
                  )}
                  {contract.start_date && (
                    <p><strong>Start Date:</strong> {new Date(contract.start_date).toLocaleDateString()}</p>
                  )}
                  {contract.budget_range && (
                    <p><strong>Budget Range:</strong> {contract.budget_range}</p>
                  )}
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium mb-2">Description:</p>
                    <p className="whitespace-pre-wrap">{contract.description}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex justify-between items-center">
                  <span>Posted: {new Date(contract.created_at).toLocaleDateString()}</span>
                  <span className="font-medium text-primary">Via Drillity Platform</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
