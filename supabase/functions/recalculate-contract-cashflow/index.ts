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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { contract_number, period } = await req.json();

    if (!contract_number) {
      throw new Error('contract_number is required');
    }

    console.log(`Recalculating cashflow for contract: ${contract_number}${period ? ` period: ${period}` : ''}`);

    // 1. Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('pms_contracts')
      .select('id, tenant_id')
      .eq('contract_number', contract_number)
      .single();

    if (contractError || !contract) {
      throw new Error(`Contract not found: ${contract_number}`);
    }

    // 2. Delete existing cashflow records for this contract
    const deleteQuery = supabase
      .from('pms_cashflow_property')
      .delete()
      .eq('contract_id', contract.id);

    if (period) {
      deleteQuery.eq('period', period);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error('Error deleting cashflow:', deleteError);
      throw deleteError;
    }

    console.log(`Deleted cashflow records for contract ${contract_number}`);

    // 3. Get one payment from this contract to trigger recalculation
    const { data: payment, error: paymentError } = await supabase
      .from('pms_payments')
      .select('id')
      .eq('contract_id', contract.id)
      .limit(1)
      .single();

    if (payment) {
      // 4. Update the payment to trigger the cashflow trigger
      const { error: updateError } = await supabase
        .from('pms_payments')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', payment.id);

      if (updateError) {
        console.error('Error triggering recalculation:', updateError);
        throw updateError;
      }

      console.log('Triggered cashflow recalculation via payment update');
    } else {
      console.log('No payments found, cashflow will be empty');
    }

    // 5. Fetch the recalculated cashflow to return
    const { data: newCashflow, error: cashflowError } = await supabase
      .from('pms_cashflow_property')
      .select('*')
      .eq('contract_id', contract.id)
      .order('period', { ascending: false });

    if (cashflowError) {
      console.error('Error fetching new cashflow:', cashflowError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cashflow recalculated for contract ${contract_number}`,
        cashflow: newCashflow || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recalculate-contract-cashflow:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
