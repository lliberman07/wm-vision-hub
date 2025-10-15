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

    console.log(`Vinculando pagos existentes para contrato: ${contractId}`);

    // Primero vincular pagos existentes
    const { error: linkError } = await supabaseClient.rpc('link_existing_payments_to_schedule', {
      contract_id_param: contractId,
    });

    if (linkError) {
      console.error('Error vinculando pagos:', linkError);
      throw linkError;
    }

    console.log(`Regenerando schedule items para contrato: ${contractId}`);

    // Luego regenerar el calendario
    const { error: generateError } = await supabaseClient.rpc('generate_payment_schedule_items', {
      contract_id_param: contractId,
    });

    if (generateError) {
      console.error('Error regenerando schedule items:', generateError);
      throw generateError;
    }

    // Verificar cuántos items se crearon
    const { data: items, error: countError } = await supabaseClient
      .from('pms_payment_schedule_items')
      .select('id', { count: 'exact' })
      .eq('contract_id', contractId);

    if (countError) {
      console.error('Error contando schedule items:', countError);
      throw countError;
    }

    console.log(`Successfully processed ${items?.length || 0} schedule items`);

    return new Response(
      JSON.stringify({
        success: true,
        itemsCreated: items?.length || 0,
        message: `Se vincularon los pagos existentes y se regeneraron ${items?.length || 0} items de calendario de pagos`,
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
