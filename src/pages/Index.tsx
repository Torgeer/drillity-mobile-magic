import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import drillityLogo from "@/assets/drillity-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, userType, loading } = useAuth();

  useEffect(() => {
    console.log('Index redirect check:', { loading, user: !!user, userType });
    
    if (!loading) {
      if (user && userType) {
        // Redirect based on user type
        console.log('Redirecting user with type:', userType);
        if (userType === 'company') {
          console.log('Navigating to company dashboard');
          navigate("/company/dashboard");
        } else {
          console.log('Navigating to talent dashboard');
          navigate("/dashboard");
        }
      } else {
        console.log('No user or userType, navigating to auth');
        navigate("/auth");
      }
    }
  }, [user, userType, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4 animate-pulse">
          <img src={drillityLogo} alt="Drillity" className="h-12" />
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
