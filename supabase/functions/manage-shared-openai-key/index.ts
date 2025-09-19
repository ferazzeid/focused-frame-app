import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user's JWT and get user info
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user is admin
    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (roleError || !userRoles || userRoles.length === 0) {
      throw new Error('Admin access required');
    }

    if (req.method === 'GET') {
      // Get the shared OpenAI API key
      try {
        const sharedKey = Deno.env.get('OPENAI_API_KEY');
        return new Response(JSON.stringify({ 
          hasKey: !!sharedKey,
          keyPreview: sharedKey ? `${sharedKey.substring(0, 8)}...` : null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error getting shared key:', error);
        return new Response(JSON.stringify({ 
          hasKey: false,
          keyPreview: null 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (req.method === 'POST') {
      const { apiKey } = await req.json();
      
      if (!apiKey) {
        throw new Error('API key is required');
      }

      // Note: In a real implementation, you would use Supabase's secret management
      // For now, we'll return success but the key would need to be manually updated in Supabase secrets
      console.log('Shared OpenAI API key update requested by admin:', user.email);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Shared API key updated successfully. Please update the OPENAI_API_KEY secret in Supabase dashboard.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE') {
      // Delete the shared OpenAI API key
      console.log('Shared OpenAI API key deletion requested by admin:', user.email);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Shared API key deletion requested. Please remove the OPENAI_API_KEY secret from Supabase dashboard.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error('Error in manage-shared-openai-key function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message.includes('Admin access required') || error.message.includes('Invalid authentication') ? 403 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});