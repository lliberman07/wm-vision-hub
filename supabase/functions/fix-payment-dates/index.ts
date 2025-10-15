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

    console.log(`Corrigiendo fechas de pago para contrato: ${contractId}`);

    // Obtener todos los schedule items pendientes ordenados por fecha
    const { data: scheduleItems, error: scheduleError } = await supabaseClient
      .from('pms_payment_schedule_items')
      .select('id, period_date, expected_amount, payment_id, status')
      .eq('contract_id', contractId)
      .order('period_date', { ascending: true });

    if (scheduleError) {
      console.error('Error obteniendo schedule items:', scheduleError);
      throw scheduleError;
    }

    // Obtener todos los pagos del contrato ordenados por fecha de creación
    const { data: payments, error: paymentsError } = await supabaseClient
      .from('pms_payments')
      .select('id, paid_amount, paid_date, created_at, status')
      .eq('contract_id', contractId)
      .eq('status', 'paid')
      .order('created_at', { ascending: true });

    if (paymentsError) {
      console.error('Error obteniendo pagos:', paymentsError);
      throw paymentsError;
    }

    console.log(`Encontrados ${scheduleItems?.length || 0} schedule items y ${payments?.length || 0} pagos`);

    let updatedCount = 0;
    let linkedCount = 0;

    // Asignar cada pago al schedule item correspondiente en orden cronológico
    for (let i = 0; i < (payments?.length || 0) && i < (scheduleItems?.length || 0); i++) {
      const payment = payments![i];
      const scheduleItem = scheduleItems![i];

      // Actualizar la fecha del pago al período del schedule item
      const { error: updatePaymentError } = await supabaseClient
        .from('pms_payments')
        .update({ paid_date: scheduleItem.period_date })
        .eq('id', payment.id);

      if (updatePaymentError) {
        console.error(`Error actualizando pago ${payment.id}:`, updatePaymentError);
        continue;
      }

      updatedCount++;

      // Vincular el schedule item con el pago
      const { error: updateScheduleError } = await supabaseClient
        .from('pms_payment_schedule_items')
        .update({ 
          payment_id: payment.id,
          status: 'paid'
        })
        .eq('id', scheduleItem.id);

      if (updateScheduleError) {
        console.error(`Error vinculando schedule item ${scheduleItem.id}:`, updateScheduleError);
        continue;
      }

      linkedCount++;
      console.log(`✓ Pago ${i + 1}: $${payment.paid_amount} → ${scheduleItem.period_date}`);
    }

    console.log(`Proceso completado: ${updatedCount} fechas actualizadas, ${linkedCount} pagos vinculados`);

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount,
        linkedCount,
        message: `Se corrigieron ${updatedCount} fechas de pago y se vincularon ${linkedCount} items del calendario`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in fix-payment-dates function:', error);
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
