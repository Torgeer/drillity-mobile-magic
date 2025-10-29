import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function TalentSubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    
    if (!sessionId) {
      setStatus('error');
      setErrorMessage("No session ID found");
      return;
    }

    verifyPayment(sessionId);
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('talent-verify-subscription', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      setStatus('success');
      
      // Redirect to subscription page after 3 seconds
      setTimeout(() => {
        navigate('/subscription');
      }, 3000);
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setStatus('error');
      setErrorMessage(error.message || "Failed to verify payment");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        {status === 'loading' && (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Verifying Payment...</h2>
            <p className="text-muted-foreground">Please wait while we confirm your subscription</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Payment Successful!</h2>
            <p className="text-muted-foreground">
              Your subscription has been activated. You now have access to all premium features.
            </p>
            <div className="pt-4 space-y-2 text-left">
              <p className="text-sm">✅ Unlimited job applications</p>
              <p className="text-sm">✅ AI-powered profile & matching</p>
              <p className="text-sm">✅ Advanced analytics</p>
              <p className="text-sm">✅ Priority support</p>
            </div>
            <p className="text-sm text-muted-foreground pt-4">
              Redirecting to subscription page...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Payment Error</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <Button onClick={() => navigate('/subscription')} className="w-full">
              Return to Subscriptions
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
