import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth, UserType } from "@/hooks/useAuth";
import { toast } from "sonner";
import { authenticateWithBiometrics, getBiometricCredentials, setBiometricCredentials } from "@/utils/capacitorPlugins";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<UserType>('talent');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleBiometricAuth = async () => {
    try {
      await authenticateWithBiometrics();
      const credentials = await getBiometricCredentials();
      
      if (credentials) {
        setLoading(true);
        const { error } = await signIn(credentials.username, credentials.password);
        
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Logged in successfully!");
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Biometric authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        
        if (error) {
          toast.error(error.message);
        } else {
          // Offer to save credentials for biometric auth
          try {
            await setBiometricCredentials(email, password);
          } catch {}
          
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
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <span className="text-2xl font-bold text-primary-foreground">D</span>
            </div>
            <span className="text-3xl font-bold">Drillity</span>
          </div>
        </div>

        <Card className="p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">{isLogin ? "Welcome Back" : "Get Started"}</h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Sign in to your account" : "Create your Drillity account"}
            </p>
          </div>

          {!isLogin && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={userType === 'talent' ? 'default' : 'outline'}
                onClick={() => setUserType('talent')}
              >
                I'm looking for work
              </Button>
              <Button
                type="button"
                variant={userType === 'company' ? 'default' : 'outline'}
                onClick={() => setUserType('company')}
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

          {isLogin && (
            <div className="mt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleBiometricAuth}
              >
                Sign in with Biometrics
              </Button>
            </div>
          )}

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
