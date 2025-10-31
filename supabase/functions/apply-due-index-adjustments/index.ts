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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date().toISOString().split('T')[0];
    
    console.log(`[${new Date().toISOString()}] Starting automatic adjustment process for ${today}`);

    // Buscar contratos con ajuste pendiente
    const { data: contracts, error: contractsError } = await supabaseClient
      .from('pms_contract_current')
      .select('contract_id, next_adjustment_date')
      .lte('next_adjustment_date', today)
      .order('next_adjustment_date', { ascending: true });

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      throw contractsError;
    }

    console.log(`Found ${contracts?.length || 0} contracts with due adjustments`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const contract of contracts || []) {
      try {
        console.log(`Processing contract ${contract.contract_id}...`);
        
        const { data: result, error: rpcError } = await supabaseClient
          .rpc('rpc_apply_contract_adjustment', {
            p_contract_id: contract.contract_id,
            p_asof: today
          });

        if (rpcError) {
          console.error(`RPC Error for contract ${contract.contract_id}:`, rpcError);
          errorCount++;
          results.push({
            contract_id: contract.contract_id,
            success: false,
            error: rpcError.message
          });
        } else {
          console.log(`Contract ${contract.contract_id}: ${JSON.stringify(result)}`);
          
          if (result?.error) {
            results.push({
              contract_id: contract.contract_id,
              success: false,
              message: result.error
            });
          } else if (result?.success) {
            successCount++;
            results.push({
              contract_id: contract.contract_id,
              success: true,
              prev_amount: result.prev_amount,
              new_amount: result.new_amount,
              pct_cumulative: result.pct_cumulative
            });
          } else {
            results.push({
              contract_id: contract.contract_id,
              success: true,
              message: result.message
            });
          }
        }
      } catch (error) {
        console.error(`Error processing contract ${contract.contract_id}:`, error);
        errorCount++;
        results.push({
          contract_id: contract.contract_id,
          success: false,
          error: error.message
        });
      }
    }

    const summary = {
      success: true,
      processed: results.length,
      successful: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
      results
    };

    console.log(`[${new Date().toISOString()}] Process complete:`, summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fatal error in apply-due-index-adjustments:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
