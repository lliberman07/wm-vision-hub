import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Función auxiliar para verificar autenticación JWT
async function authenticateUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { 
      user: null, 
      error: { message: 'Missing or invalid authorization header', code: 'MISSING_AUTH' } 
    };
  }

  const token = authHeader.replace('Bearer ', '');
  
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      },
      auth: {
        persistSession: false,
      }
    }
  );

  const { data: { user }, error } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    return { 
      user: null, 
      error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' } 
    };
  }

  return { user, error: null, supabaseClient };
}

// Función auxiliar para verificar roles PMS
async function checkPMSRole(supabaseClient: any, userId: string) {
  const { data: isSuperAdmin } = await supabaseClient.rpc('has_role', {
    _user_id: userId,
    _role: 'superadmin'
  });
  
  const { data: hasPMSRole } = await supabaseClient.rpc('has_pms_role', {
    _user_id: userId,
    _role: 'INMOBILIARIA'
  });

  return { hasPermission: isSuperAdmin || hasPMSRole };
}

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
    // Verificar autenticación JWT
    const { user, error: authError, supabaseClient: authClient } = await authenticateUser(req);

    if (authError || !user) {
      console.error('[fix-partial-payments] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que sea superadmin o tenga rol INMOBILIARIA en PMS
    const { hasPermission } = await checkPMSRole(authClient, user.id);

    if (!hasPermission) {
      console.error('[fix-partial-payments] Forbidden: User lacks PMS admin permissions:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden', details: 'Requiere permisos de administración PMS' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[fix-partial-payments] Authenticated admin: ${user.id}`);

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
        // Buscar pagos del mismo contrato e item, SIN filtro de fecha
        // Los pagos pueden hacerse meses después del período devengado
        const { data: payments, error: paymentsError } = await supabaseClient
          .from('pms_payments')
          .select('*')
          .eq('contract_id', item.contract_id);

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

        // Actualizar notas Y schedule_item_id de los pagos para vincularlos
        for (const payment of relevantPayments) {
          const updates: any = {};
          
          if (!payment.notes?.includes(`schedule_item:${item.id}`)) {
            updates.notes = payment.notes 
              ? `${payment.notes}\n[schedule_item:${item.id}]`
              : `[schedule_item:${item.id}]`;
          }
          
          // Vincular directamente con schedule_item_id
          if (!payment.schedule_item_id) {
            updates.schedule_item_id = item.id;
          }

          if (Object.keys(updates).length > 0) {
            await supabaseClient
              .from('pms_payments')
              .update(updates)
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
