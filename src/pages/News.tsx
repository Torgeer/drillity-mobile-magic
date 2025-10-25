import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  company_id: string;
  company_profiles: {
    company_name: string;
    logo_url: string | null;
  };
}

const News = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (userType === 'company') {
        navigate("/company/dashboard");
      }
    }
  }, [user, userType, loading, navigate]);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from('company_news')
      .select(`
        *,
        company_profiles (
          company_name,
          logo_url
        )
      `)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (data) {
      setNews(data as any);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company News</h1>
          <p className="text-muted-foreground">Latest updates from companies</p>
        </div>

        <div className="grid gap-6">
          {news.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No news available yet</p>
            </Card>
          ) : (
            news.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  {item.company_profiles.logo_url && (
                    <img 
                      src={item.company_profiles.logo_url} 
                      alt={item.company_profiles.company_name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.company_profiles.company_name} • {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}
                <p className="text-muted-foreground whitespace-pre-wrap">{item.content}</p>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default News;
