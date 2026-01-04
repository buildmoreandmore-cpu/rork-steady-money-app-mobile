import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID')!;
const PLAID_SECRET = Deno.env.get('PLAID_SECRET')!;
const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'production';

const PLAID_BASE_URL = PLAID_ENV === 'production'
  ? 'https://production.plaid.com'
  : 'https://sandbox.plaid.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log environment variables status (not the actual values)
    console.log('Environment check:', {
      hasClientId: !!PLAID_CLIENT_ID,
      hasSecret: !!PLAID_SECRET,
      plaidEnv: PLAID_ENV,
      plaidBaseUrl: PLAID_BASE_URL,
    });

    // Check for missing credentials
    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      console.error('Missing Plaid credentials');
      return new Response(
        JSON.stringify({ error: 'Plaid credentials not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET in Supabase Secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create link token with Plaid
    const response = await fetch(`${PLAID_BASE_URL}/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        user: {
          client_user_id: user_id,
        },
        client_name: 'Steady Money',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Plaid API error:', JSON.stringify(data));
      const errorMsg = data.error_message || data.display_message || 'Failed to create link token';
      return new Response(
        JSON.stringify({
          error: errorMsg,
          plaid_error_code: data.error_code,
          plaid_error_type: data.error_type,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ link_token: data.link_token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
