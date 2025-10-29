import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs"> & {
  company_profiles: Pick<Tables<"company_profiles">, "id" | "company_name" | "logo_url" | "location">;
  projects?: Pick<Tables<"projects">, "id" | "project_name"> | null;
};

interface ApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  userId: string;
  onSuccess?: () => void;
}

export const ApplyDialog = ({ open, onOpenChange, job, userId, onSuccess }: ApplyDialogProps) => {
  const { toast } = useToast();
  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [useProfileCV, setUseProfileCV] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "CV must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setCvFile(file);
      setUseProfileCV(false);
    }
  };

  const handleSubmit = async () => {
    if (!coverLetter.trim() && coverLetter.length > 0) {
      toast({
        title: "Invalid input",
        description: "Cover letter cannot be only whitespace",
        variant: "destructive",
      });
      return;
    }

    if (!cvFile && !useProfileCV) {
      toast({
        title: "CV required",
        description: "Please upload a CV or select to use your profile CV",
        variant: "destructive",
      });
      return;
    }

    if (coverLetter.length > 2000) {
      toast({
        title: "Cover letter too long",
        description: "Cover letter must be less than 2000 characters",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let cvUrl = null;

      // Upload CV if new file provided
      if (cvFile) {
        const fileExt = cvFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cv-documents')
          .upload(fileName, cvFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('cv-documents')
          .getPublicUrl(fileName);

        cvUrl = publicUrl;
      } else if (useProfileCV) {
        // Get CV from profile (assume it's stored in cv-documents bucket)
        const { data: files } = await supabase.storage
          .from('cv-documents')
          .list(userId);

        if (files && files.length > 0) {
          const latestFile = files.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          
          const { data: { publicUrl } } = supabase.storage
            .from('cv-documents')
            .getPublicUrl(`${userId}/${latestFile.name}`);
          
          cvUrl = publicUrl;
        }
      }

      // Insert application
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          talent_id: userId,
          job_id: job.id,
          company_id: job.company_id,
          cover_letter: coverLetter || null,
          cv_url: cvUrl,
          status: 'pending',
        });

      if (insertError) throw insertError;

      toast({
        title: "Application submitted!",
        description: "Your application has been sent successfully.",
      });

      onOpenChange(false);
      setCoverLetter("");
      setCvFile(null);
      setUseProfileCV(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {job.company_profiles.company_name}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
            <Textarea
              id="cover-letter"
              placeholder="Tell the employer why you're a great fit for this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {coverLetter.length}/2000 characters
            </p>
          </div>

          <div className="space-y-3">
            <Label>CV/Resume *</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-profile-cv"
                checked={useProfileCV}
                onCheckedChange={(checked) => {
                  setUseProfileCV(checked as boolean);
                  if (checked) setCvFile(null);
                }}
              />
              <label
                htmlFor="use-profile-cv"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use my profile CV
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">or</span>
            </div>

            <div>
              <Label htmlFor="cv-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">
                    {cvFile ? cvFile.name : "Upload new CV"}
                  </span>
                </div>
              </Label>
              <input
                id="cv-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOC, or DOCX (max 10MB)
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
