import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, userType, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && userType) {
        // Redirect based on user type
        if (userType === 'company') {
          navigate("/company/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/auth");
      }
    }
  }, [user, userType, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary animate-pulse">
            <span className="text-2xl font-bold text-primary-foreground">D</span>
          </div>
          <span className="text-3xl font-bold">Drillity</span>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
