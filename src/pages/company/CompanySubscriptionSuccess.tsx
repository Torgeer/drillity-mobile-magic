import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompanySubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('No session ID found');
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-checkout-session', {
          body: { session_id: sessionId }
        });

        if (error) throw error;

        if (data.success) {
          setStatus('success');
          // Redirect after 3 seconds
          setTimeout(() => {
            navigate('/company/subscription');
          }, 3000);
        } else {
          throw new Error('Verification failed');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Failed to verify payment');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
              <CardTitle className="text-2xl">Verifying Payment...</CardTitle>
              <CardDescription>Please wait while we confirm your subscription</CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Payment Successful! 🎉</CardTitle>
              <CardDescription>Your subscription has been activated</CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Payment Verification Failed</CardTitle>
              <CardDescription className="text-destructive">{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'success' && (
            <>
              <p className="text-muted-foreground">
                You now have access to all premium features including:
              </p>
              <ul className="text-left space-y-2 max-w-md mx-auto">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>14-day free trial period</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>1 free AI match per job per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Access to all platform features</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Redirecting to subscription page in 3 seconds...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <Button onClick={() => navigate('/company/subscription')}>
              Return to Subscriptions
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}