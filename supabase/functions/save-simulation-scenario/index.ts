import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, simulationData, analysisResults } = await req.json();

    console.log('Saving simulation for email:', email);

    // Generate reference number
    const referenceNumber = `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Insert simulation record
    const { data, error } = await supabase
      .from('investment_simulations')
      .insert({
        user_email: email,
        reference_number: referenceNumber,
        simulation_data: simulationData,
        analysis_results: analysisResults,
        profile_status: 'not_started',
        profile_step: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving simulation:', error);
      throw error;
    }

    console.log('Simulation saved successfully:', data.id);

    // TODO: Send email with reference number using Resend
    // For now, we'll return success

    return new Response(
      JSON.stringify({ 
        success: true, 
        reference_number: referenceNumber,
        simulation_id: data.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in save-simulation-scenario function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});