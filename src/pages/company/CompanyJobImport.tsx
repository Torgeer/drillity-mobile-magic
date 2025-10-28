import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileJson, FileText } from "lucide-react";

const CompanyJobImport = () => {
  const [jsonData, setJsonData] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleJsonImport = async () => {
    try {
      setLoading(true);
      const jobs = JSON.parse(jsonData);
      
      if (!Array.isArray(jobs)) {
        throw new Error("Data must be an array of jobs");
      }

      // Get current company profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!companyProfile) throw new Error("Company profile not found");

      // Insert jobs
      const jobsToInsert = jobs.map(job => ({
        company_id: companyProfile.id,
        title: job.title,
        description: job.description,
        location: job.location,
        job_type: job.job_type || 'full_time',
        experience_level: job.experience_level || 'mid',
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency || 'USD',
        remote: job.remote || false,
        skills: job.skills || [],
        certifications: job.certifications || [],
      }));

      const { error } = await supabase
        .from("jobs")
        .insert(jobsToInsert);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${jobs.length} jobs imported`,
      });
      
      setJsonData("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      
      if (file.name.endsWith('.json')) {
        setJsonData(text);
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV parsing
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const jobs = lines.slice(1).map(line => {
          const values = line.split(',');
          const job: any = {};
          headers.forEach((header, i) => {
            job[header] = values[i]?.trim();
          });
          return job;
        }).filter(job => job.title);
        
        setJsonData(JSON.stringify(jobs, null, 2));
      }
    };
    reader.readAsText(file);
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Import Jobs</h1>
          <p className="text-muted-foreground">Import multiple jobs at once from JSON or CSV</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload file
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label>Choose file (JSON or CSV)</Label>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm"
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                <p className="font-semibold flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  JSON format:
                </p>
                <pre className="text-xs overflow-x-auto">
{`[
  {
    "title": "Senior Drilling Engineer",
    "description": "Job description...",
    "location": "Houston, TX",
    "job_type": "full_time",
    "experience_level": "senior",
    "salary_min": 100000,
    "salary_max": 150000,
    "skills": ["Drilling", "Safety"],
    "remote": false
  }
]`}
                </pre>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                <p className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CSV format:
                </p>
                <pre className="text-xs overflow-x-auto">
{`title,description,location,job_type,experience_level,salary_min,salary_max
Senior Drilling Engineer,Job description...,Houston TX,full_time,senior,100000,150000`}
                </pre>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">JSON Data</h2>
            
            <div className="space-y-4">
              <div>
                <Label>Paste JSON data</Label>
                <Textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  placeholder="Paste your JSON data here..."
                  className="min-h-[400px] font-mono text-xs"
                />
              </div>

              <Button 
                onClick={handleJsonImport} 
                disabled={!jsonData || loading}
                className="w-full"
              >
                {loading ? "Importing..." : "Import Jobs"}
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-2">API Import (Advanced)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you have many jobs on your existing website, you can use our API for automatic import.
          </p>
          <div className="space-y-2 text-sm font-mono bg-background p-4 rounded-lg">
            <p>POST https://kjfjsgzllpqgmpcqpvuz.supabase.co/rest/v1/jobs</p>
            <p className="text-muted-foreground">Headers: Authorization: Bearer YOUR_API_KEY</p>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Contact support for an API key and documentation for bulk importing 100+ jobs.
          </p>
        </Card>
      </div>
    </CompanyLayout>
  );
};

export default CompanyJobImport;
