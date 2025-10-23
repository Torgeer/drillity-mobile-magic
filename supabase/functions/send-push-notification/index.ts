import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, body, data }: PushNotificationRequest = await req.json();

    console.log('Sending push notification to user:', userId);

    // Get user's push tokens from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const tokensResponse = await fetch(
      `${supabaseUrl}/rest/v1/push_tokens?user_id=eq.${userId}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const tokens = await tokensResponse.json();

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for user:', userId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No push tokens found for this user' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    console.log(`Found ${tokens.length} push token(s) for user`);

    // Send push notifications to all user devices
    const notifications = tokens.map((token: any) => {
      const notification = {
        to: token.token,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high',
      };

      console.log('Sending notification:', notification);

      // Send to Expo Push Notification service
      return fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });
    });

    const results = await Promise.all(notifications);
    const responses = await Promise.all(results.map(r => r.json()));

    console.log('Push notification results:', responses);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push notifications sent',
        results: responses
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
