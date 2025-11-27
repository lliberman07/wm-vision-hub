import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ SECURITY: Validación de input con Zod
const SimulationSchema = z.object({
  email: z.string().email().max(255),
  simulationData: z.record(z.unknown()).refine(
    (data) => JSON.stringify(data).length < 100000, // 100KB limit
    { message: "Simulation data too large" }
  ),
  analysisResults: z.record(z.unknown()).refine(
    (data) => JSON.stringify(data).length < 100000, // 100KB limit
    { message: "Analysis results too large" }
  ),
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
    const validationResult = SimulationSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: validationResult.error.errors 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { email, simulationData, analysisResults } = validationResult.data;

    console.log('Saving simulation for email:', email);

    // Obtener el user_id si está autenticado
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch (error) {
        console.log('No authenticated user, proceeding as anonymous');
      }
    }

    // Generate reference number
    const referenceNumber = `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Insert simulation record con user_id
    const { data, error } = await supabase
      .from('investment_simulations')
      .insert({
        user_email: email,
        user_id: userId,
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
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
