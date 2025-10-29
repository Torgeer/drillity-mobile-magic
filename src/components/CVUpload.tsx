import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Upload, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { capturePhoto, pickDocument } from "@/utils/capacitorPlugins";
import { supabase } from "@/integrations/supabase/client";

interface CVUploadProps {
  userId: string;
  onUploadComplete?: (url: string) => void;
}

export const CVUpload = ({ userId, onUploadComplete }: CVUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [currentCV, setCurrentCV] = useState<string | null>(null);

  const uploadFile = async (fileData: string, fileName: string) => {
    setUploading(true);
    
    try {
      // Check current CV count and subscription limits
      const { data: files } = await supabase.storage
        .from('cv-documents')
        .list(userId);

      const cvCount = files?.length || 0;

      const { data: subData, error: subError } = await supabase.functions.invoke('talent-check-subscription');
      
      if (subError) throw new Error("Failed to check subscription status");
      
      const subscription = subData;
      const cvLimit = subscription.cv_upload_limit || 1;

      if (cvLimit !== -1 && cvCount >= cvLimit) {
        toast.error(`You've reached your limit of ${cvLimit} CV upload${cvLimit > 1 ? 's' : ''}. Upgrade to upload more.`);
        setUploading(false);
        return;
      }

      // Convert base64 to blob
      const response = await fetch(fileData);
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const filePath = `${userId}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('cv-documents')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      setCurrentCV(filePath);
      
      if (onUploadComplete) {
        onUploadComplete(filePath);
      }

      toast.success("CV uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload CV");
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const photoData = await capturePhoto();
      if (photoData) {
        await uploadFile(photoData, `cv-scan-${Date.now()}.jpg`);
      }
    } catch (error) {
      toast.error("Failed to capture photo");
    }
  };

  const handleDocumentPick = async () => {
    try {
      const docData = await pickDocument();
      if (docData) {
        await uploadFile(docData, `cv-${Date.now()}.pdf`);
      }
    } catch (error) {
      toast.error("Failed to pick document");
    }
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      await uploadFile(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const removeCurrent = () => {
    setCurrentCV(null);
    toast.success("CV removed");
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">CV/Resume</h3>
      
      {currentCV ? (
        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">Current CV</p>
              <p className="text-sm text-muted-foreground">{currentCV.split('/').pop()}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={removeCurrent}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Upload your CV/Resume to apply for jobs faster
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleCameraCapture}
              disabled={uploading}
            >
              <Camera className="h-4 w-4" />
              Scan with Camera
            </Button>

            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleDocumentPick}
              disabled={uploading}
            >
              <FileText className="h-4 w-4" />
              Pick from Gallery
            </Button>

            <label>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 w-full"
                disabled={uploading}
                asChild
              >
                <span>
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload File"}
                </span>
              </Button>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileInput}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            Accepted formats: PDF, DOC, DOCX (max 10MB)
          </p>
        </div>
      )}
    </Card>
  );
};
