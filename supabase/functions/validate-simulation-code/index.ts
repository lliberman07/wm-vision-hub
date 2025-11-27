import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ SECURITY: Validación de input
const ValidationSchema = z.object({
  reference_number: z.string().min(10).max(50),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ✅ SECURITY: Validar input
    const body = await req.json();
    const validationResult = ValidationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid reference number format',
          details: validationResult.error.errors 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { reference_number } = validationResult.data;

    console.log('Validating simulation code:', reference_number);

    // Check if simulation exists
    const { data, error } = await supabase
      .from('investment_simulations')
      .select('id, reference_number, simulation_data, analysis_results, profile_status, profile_step, created_at')
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

    // ✅ SECURITY: NO retornar user_email ni otros datos sensibles
    // Solo retornar lo necesario para el cliente
    return new Response(
      JSON.stringify({ 
        valid: true, 
        simulation: {
          id: data.id,
          reference_number: data.reference_number,
          simulation_data: data.simulation_data,
          analysis_results: data.analysis_results,
          profile_status: data.profile_status,
          profile_step: data.profile_step,
          created_at: data.created_at,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in validate-simulation-code function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
