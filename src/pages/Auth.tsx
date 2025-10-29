import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth, UserType } from "@/hooks/useAuth";
import { toast } from "sonner";
import { rateLimiter } from "@/lib/securityUtils";
import drillityLogoDark from "@/assets/drillity-logo-dark.png";
import drillityLogoLight from "@/assets/drillity-logo-light.png";
import { useTheme } from "@/hooks/useTheme";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<UserType>('talent');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { theme } = useTheme();
  const logoSrc = theme === 'light' ? drillityLogoLight : drillityLogoDark;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Rate limiting: 5 attempts per 5 minutes per email
        if (!rateLimiter.check(`login-${email}`, 5, 300000)) {
          toast.error("Too many login attempts. Please wait 5 minutes.");
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Logged in successfully!");
          navigate("/dashboard");
        }
      } else {
        const { error } = await signUp(email, password, userType, fullName);
        
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Account created successfully!");
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <img src={logoSrc} alt="Drillity" className="h-12" />
        </div>

        <Card className="p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">{isLogin ? "Welcome Back" : "Get Started"}</h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Sign in to your account" : "Create your Drillity account"}
            </p>
          </div>

          {!isLogin && (
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant={userType === 'talent' ? 'default' : 'outline'}
                onClick={() => setUserType('talent')}
                className="text-sm"
              >
                I'm looking for work
              </Button>
              <Button
                type="button"
                variant={userType === 'company' ? 'default' : 'outline'}
                onClick={() => setUserType('company')}
                className="text-sm"
              >
                I'm hiring
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="John Doe" 
                  className="mt-1" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                className="mt-1" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="mt-1" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
