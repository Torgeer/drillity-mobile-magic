import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Upload, Camera, X, Download } from "lucide-react";
import { toast } from "sonner";
import { capturePhoto, pickDocument } from "@/utils/capacitorPlugins";
import { supabase } from "@/integrations/supabase/client";

interface CVUploadProps {
  userId: string;
  onUploadComplete?: (url: string) => void;
}

interface CVFile {
  name: string;
  created_at: string;
  size: number;
}

export const CVUpload = ({ userId, onUploadComplete }: CVUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [cvFiles, setCVFiles] = useState<CVFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCVFiles();
  }, [userId]);

  const fetchCVFiles = async () => {
    try {
      const { data: files, error } = await supabase.storage
        .from('cv-documents')
        .list(userId);

      if (error) throw error;
      
      setCVFiles(files?.map(f => ({
        name: f.name,
        created_at: f.created_at,
        size: f.metadata?.size || 0
      })) || []);
    } catch (error: any) {
      console.error("Error fetching CV files:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (fileData: string, fileName: string) => {
    setUploading(true);
    
    try {
      // Check current CV count and subscription limits
      const cvCount = cvFiles.length;

      const { data: subData, error: subError } = await supabase.functions.invoke('talent-check-subscription');
      
      if (subError) throw new Error("Failed to check subscription status");
      
      const subscription = subData;
      const cvLimit = subscription?.plan_details?.cv_upload_limit || 1;

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
          upsert: false
        });

      if (uploadError) throw uploadError;
      
      if (onUploadComplete) {
        onUploadComplete(filePath);
      }

      toast.success("CV uploaded successfully!");
      await fetchCVFiles();
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

  const handleDelete = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from('cv-documents')
        .remove([`${userId}/${fileName}`]);

      if (error) throw error;
      
      toast.success("CV deleted");
      await fetchCVFiles();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete CV");
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('cv-documents')
        .download(`${userId}/${fileName}`);

      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Failed to download CV");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">CV/Resume</h3>
      
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading CVs...</p>
      ) : (
        <>
          {cvFiles.length > 0 && (
            <div className="space-y-2 mb-6">
              {cvFiles.map((file) => (
                <div key={file.name} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • Uploaded {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDownload(file.name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(file.name)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {cvFiles.length === 0 ? "Upload your CV/Resume to apply for jobs faster" : "Upload additional CV"}
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
        </>
      )}
    </Card>
  );
};
