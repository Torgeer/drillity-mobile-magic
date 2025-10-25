import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  published: boolean;
  created_at: string;
  company_id: string;
}

const CompanyNews = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    published: true
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (userType === 'talent') {
        navigate("/dashboard");
      }
    }
  }, [user, userType, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCompanyId();
    }
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchNews();
    }
  }, [companyId]);

  const fetchCompanyId = async () => {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      setCompanyId(data.id);
    }
  };

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from('company_news')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (data) {
      setNews(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) return;

    if (editingNews) {
      const { error } = await supabase
        .from('company_news')
        .update(formData)
        .eq('id', editingNews.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update news",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "News updated successfully"
        });
        fetchNews();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('company_news')
        .insert([{ ...formData, company_id: companyId }]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create news",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "News posted successfully"
        });
        fetchNews();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('company_news')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete news",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "News deleted successfully"
      });
      fetchNews();
    }
  };

  const handleEdit = (newsItem: NewsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      image_url: newsItem.image_url || "",
      published: newsItem.published
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      image_url: "",
      published: true
    });
    setEditingNews(null);
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Company News</h1>
            <p className="text-muted-foreground">Share updates with talent</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Post News
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingNews ? "Edit News" : "Create News Post"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="image_url">Image URL (optional)</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                  />
                  <Label htmlFor="published">Publish immediately</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingNews ? "Update" : "Post"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {news.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No news posted yet</p>
            </Card>
          ) : (
            news.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      {!item.published && (
                        <span className="px-2 py-1 text-xs bg-muted rounded-md">Draft</span>
                      )}
                    </div>
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <p className="text-muted-foreground whitespace-pre-wrap mb-4">{item.content}</p>
                    <p className="text-sm text-muted-foreground">
                      Posted on {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyNews;
