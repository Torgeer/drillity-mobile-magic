import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddCertificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

export const AddCertificationDialog = ({ open, onOpenChange, userId, onSuccess }: AddCertificationDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    certification_name: "",
    issuer: "",
    issue_date: "",
    expiry_date: "",
  });

  const handleSubmit = async () => {
    if (!formData.certification_name.trim()) {
      toast({
        title: "Certification name required",
        description: "Please enter a certification name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check current certification count and subscription limits
      const { count: certCount } = await supabase
        .from('talent_certifications')
        .select('*', { count: 'exact', head: true })
        .eq('talent_id', userId);

      const { data: subData, error: subError } = await supabase.functions.invoke('talent-check-subscription');
      
      if (subError) throw new Error("Failed to check subscription status");
      
      const subscription = subData;
      const certLimit = subscription.certification_limit;

      if (certLimit !== null && certLimit !== -1 && (certCount || 0) >= certLimit) {
        toast({
          title: "Certification limit reached",
          description: `You've reached your limit of ${certLimit} certifications. Upgrade to add more.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('talent_certifications')
        .insert({
          talent_id: userId,
          certification_name: formData.certification_name,
          issuer: formData.issuer || null,
          issue_date: formData.issue_date || null,
          expiry_date: formData.expiry_date || null,
        });

      if (error) throw error;

      toast({
        title: "Certification added",
        description: "Your certification has been added successfully.",
      });

      setFormData({
        certification_name: "",
        issuer: "",
        issue_date: "",
        expiry_date: "",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding certification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add certification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Certification</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cert-name">Certification Name *</Label>
            <Input
              id="cert-name"
              value={formData.certification_name}
              onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
              placeholder="e.g., IADC WellCAP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuer">Issuer</Label>
            <Input
              id="issuer"
              value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
              placeholder="e.g., International Association of Drilling Contractors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue-date">Issue Date</Label>
              <Input
                id="issue-date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry-date">Expiry Date</Label>
              <Input
                id="expiry-date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Certification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
