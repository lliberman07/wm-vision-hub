import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Step 1: Fix the payment with incorrect paid_amount
    const { error: paymentError } = await supabaseClient
      .from('pms_payments')
      .update({ 
        paid_amount: 300000.00,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'a9a6559b-3ad2-40fa-9c5a-3eb56d7f0ac2')

    if (paymentError) {
      throw new Error(`Error updating payment: ${paymentError.message}`)
    }

    // Step 2: Get the corrected total income for October 2025
    // NOTE: All payments for Aug, Sep, and Oct were paid on 2025-10-15
    const { data: payments, error: sumError } = await supabaseClient
      .from('pms_payments')
      .select('paid_amount, paid_date, due_date')
      .eq('contract_id', 'c7986757-cf43-442e-88d0-1f12ef085de2')
      .eq('status', 'paid')
      .gte('paid_date', '2025-10-01')
      .lt('paid_date', '2025-11-01')

    if (sumError) {
      throw new Error(`Error calculating total: ${sumError.message}`)
    }

    const totalIncome = payments.reduce((sum, p) => sum + (p.paid_amount || 0), 0)

    // Step 3: Update cashflow with corrected total
    const { error: cashflowError } = await supabaseClient
      .from('pms_cashflow_property')
      .update({ 
        total_income: totalIncome,
        updated_at: new Date().toISOString()
      })
      .eq('contract_id', 'c7986757-cf43-442e-88d0-1f12ef085de2')
      .eq('period', '2025-10')

    if (cashflowError) {
      throw new Error(`Error updating cashflow: ${cashflowError.message}`)
    }

    // Step 4: Verify the correction
    const { data: verifyPayment } = await supabaseClient
      .from('pms_payments')
      .select('id, due_date, amount, paid_amount, status')
      .eq('id', 'a9a6559b-3ad2-40fa-9c5a-3eb56d7f0ac2')
      .single()

    const { data: verifyCashflow } = await supabaseClient
      .from('pms_cashflow_property')
      .select('period, total_income, total_expenses, net_result')
      .eq('contract_id', 'c7986757-cf43-442e-88d0-1f12ef085de2')
      .eq('period', '2025-10')
      .single()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Corrección aplicada exitosamente',
        correction: {
          payment_fixed: verifyPayment,
          cashflow_updated: verifyCashflow,
          total_income_corrected: totalIncome
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in fix-prima4302-payment:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
