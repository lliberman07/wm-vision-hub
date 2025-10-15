import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleItem {
  id: string;
  contract_id: string;
  period_date: string;
  item: string;
  expected_amount: number;
  accumulated_paid_amount: number;
  original_amount: number;
  status: string;
}

interface Payment {
  id: string;
  contract_id: string;
  paid_date: string;
  paid_amount: number;
  item: string;
  notes: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    console.log('Starting partial payments correction...');

    // 1. Obtener todos los schedule items con pagos parciales o completados
    const { data: scheduleItems, error: scheduleError } = await supabaseClient
      .from('pms_payment_schedule_items')
      .select('*')
      .in('status', ['paid', 'partial'])
      .order('period_date');

    if (scheduleError) throw scheduleError;

    console.log(`Found ${scheduleItems?.length || 0} schedule items to process`);

    let correctedCount = 0;
    let errorCount = 0;

    // 2. Para cada schedule item, buscar y vincular sus pagos
    for (const item of (scheduleItems as ScheduleItem[])) {
      try {
        const monthStart = new Date(item.period_date);
        monthStart.setDate(1);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);

        // Buscar pagos del mismo contrato, item y mes
        const { data: payments, error: paymentsError } = await supabaseClient
          .from('pms_payments')
          .select('*')
          .eq('contract_id', item.contract_id)
          .gte('paid_date', monthStart.toISOString().split('T')[0])
          .lte('paid_date', monthEnd.toISOString().split('T')[0]);

        if (paymentsError) {
          console.error(`Error fetching payments for item ${item.id}:`, paymentsError);
          errorCount++;
          continue;
        }

        if (!payments || payments.length === 0) {
          console.log(`No payments found for item ${item.id}`);
          continue;
        }

        // Filtrar pagos que coincidan con el item (A o B)
        const relevantPayments = (payments as Payment[]).filter(p => 
          !p.item || p.item === item.item || p.item === 'UNICO'
        );

        if (relevantPayments.length === 0) continue;

        // Calcular el total pagado
        const totalPaid = relevantPayments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
        const originalAmount = item.original_amount || item.expected_amount;
        const newPendingAmount = originalAmount - totalPaid;
        const isTotallyPaid = newPendingAmount <= 0.01;

        console.log(`Item ${item.id}: Original=${originalAmount}, Paid=${totalPaid}, Pending=${newPendingAmount}`);

        // Actualizar notas de los pagos para vincularlos
        for (const payment of relevantPayments) {
          if (!payment.notes?.includes(`schedule_item:${item.id}`)) {
            const updatedNotes = payment.notes 
              ? `${payment.notes}\n[schedule_item:${item.id}]`
              : `[schedule_item:${item.id}]`;

            await supabaseClient
              .from('pms_payments')
              .update({ notes: updatedNotes })
              .eq('id', payment.id);
          }
        }

        // Actualizar el schedule item
        const { error: updateError } = await supabaseClient
          .from('pms_payment_schedule_items')
          .update({
            accumulated_paid_amount: totalPaid,
            expected_amount: Math.max(0, newPendingAmount),
            status: isTotallyPaid ? 'paid' : 'partial',
            payment_id: isTotallyPaid && relevantPayments.length === 1 ? relevantPayments[0].id : null,
          })
          .eq('id', item.id);

        if (updateError) {
          console.error(`Error updating item ${item.id}:`, updateError);
          errorCount++;
        } else {
          correctedCount++;
        }

      } catch (itemError) {
        console.error(`Error processing item ${item.id}:`, itemError);
        errorCount++;
      }
    }

    console.log(`Correction completed: ${correctedCount} items corrected, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        correctedCount,
        errorCount,
        totalProcessed: scheduleItems?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in fix-partial-payments:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
