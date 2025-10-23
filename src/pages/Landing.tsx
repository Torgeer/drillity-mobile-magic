import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import drillityLogo from "@/assets/drillity-logo.png";
import { Briefcase, Building2, Download, Newspaper } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const { canInstall, installPWA } = usePWAInstall();
  
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<'talent' | 'company'>('talent');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate(userType === 'company' ? '/company/dashboard' : '/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        toast({
          title: "Välkommen tillbaka!",
          description: "Du är nu inloggad.",
        });
      } else {
        const { error } = await signUp(email, password, userType, fullName);
        if (error) throw error;
        
        toast({
          title: "Registrering lyckades!",
          description: "Du kan nu logga in.",
        });
        
        // Show PWA install prompt for talent users on mobile
        if (userType === 'talent' && canInstall) {
          setTimeout(() => installPWA(), 1000);
        }
      }
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const newsItems = [
    {
      title: "Drillity expanderar till Norge",
      date: "15 Oktober 2025",
      excerpt: "Vi öppnar nya möjligheter för borrpersonal på norska kontinentalsockeln.",
    },
    {
      title: "Nya säkerhetscertifieringar tillgängliga",
      date: "8 Oktober 2025",
      excerpt: "Uppdatera din profil med de senaste IWCF och IADC-certifieringarna.",
    },
    {
      title: "50+ nya jobb denna vecka",
      date: "1 Oktober 2025",
      excerpt: "Ledande offshore-företag söker erfarna borrchefer och riggtekhniker.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={drillityLogo} alt="Drillity" className="h-10" />
            <span className="text-xl font-bold">Drillity</span>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Registrera dig" : "Logga in"}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Hero Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Din karriärplattform inom borrning
              </h1>
              <p className="text-xl text-muted-foreground">
                Koppla samman med ledande borrföretag världen över. 
                Hitta ditt nästa uppdrag inom offshore, onshore och riktad borrning.
              </p>
            </div>

            {/* PWA Install Prompt */}
            {canInstall && (
              <Card className="bg-primary/10 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Ladda ner appen
                  </CardTitle>
                  <CardDescription>
                    Installera Drillity på din telefon för bästa upplevelse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={installPWA} className="w-full">
                    Installera nu
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <div className="grid gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Briefcase className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>För arbetsökande</CardTitle>
                    <CardDescription>
                      Hitta jobb, visa upp dina certifieringar och kom i kontakt med företag
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>För företag</CardTitle>
                    <CardDescription>
                      Publicera jobb, sök talanger och hantera din rekrytering
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* News Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Newspaper className="h-6 w-6" />
                Senaste nytt
              </h2>
              <div className="space-y-3">
                {newsItems.map((item, index) => (
                  <Card key={index} className="hover:bg-accent/50 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <CardDescription>{item.excerpt}</CardDescription>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {item.date}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <div className="lg:sticky lg:top-8">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isLogin ? "Logga in" : "Skapa konto"}
                </CardTitle>
                <CardDescription>
                  {isLogin 
                    ? "Välkommen tillbaka till Drillity" 
                    : "Kom igång med Drillity idag"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Namn</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Jag är</Label>
                        <Tabs value={userType} onValueChange={(v) => setUserType(v as 'talent' | 'company')}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="talent">
                              <Briefcase className="h-4 w-4 mr-2" />
                              Arbetsökande
                            </TabsTrigger>
                            <TabsTrigger value="company">
                              <Building2 className="h-4 w-4 mr-2" />
                              Företag
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">E-post</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Lösenord</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Laddar..." : isLogin ? "Logga in" : "Registrera"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 Drillity. Din karriärplattform inom borrning.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
