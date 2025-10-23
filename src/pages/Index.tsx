import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard on load - replace with your existing landing page route if needed
    navigate("/dashboard");
  }, [navigate]);

  return null;
};

export default Index;
