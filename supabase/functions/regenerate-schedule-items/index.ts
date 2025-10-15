import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { contractId } = await req.json();

    if (!contractId) {
      throw new Error('contractId is required');
    }

    console.log(`Regenerating schedule items for contract: ${contractId}`);

    // Ejecutar la función de regeneración
    const { data, error } = await supabaseClient.rpc('generate_payment_schedule_items', {
      contract_id_param: contractId,
    });

    if (error) {
      console.error('Error regenerating schedule items:', error);
      throw error;
    }

    // Verificar cuántos items se crearon
    const { data: items, error: countError } = await supabaseClient
      .from('pms_payment_schedule_items')
      .select('id', { count: 'exact' })
      .eq('contract_id', contractId);

    if (countError) {
      console.error('Error counting schedule items:', countError);
      throw countError;
    }

    console.log(`Successfully created ${items?.length || 0} schedule items`);

    return new Response(
      JSON.stringify({
        success: true,
        itemsCreated: items?.length || 0,
        message: `Se generaron ${items?.length || 0} items de calendario de pagos`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in regenerate-schedule-items function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
