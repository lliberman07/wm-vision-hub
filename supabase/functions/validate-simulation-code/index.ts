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

    const { reference_number } = await req.json();

    console.log('Validating simulation code:', reference_number);

    // Check if simulation exists
    const { data, error } = await supabase
      .from('investment_simulations')
      .select('*')
      .eq('reference_number', reference_number)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error validating simulation:', error);
      throw error;
    }

    if (!data) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Código de simulación no encontrado' 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Simulation found:', data.id);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        simulation: data
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in validate-simulation-code function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});