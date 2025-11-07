import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OverdueItem {
  id: string;
  tenant_id: string;
  contract_id: string;
  period_date: string;
  expected_amount: number;
  item: string;
  pms_contracts: {
    contract_number: string;
    tenant_renter_id: string;
    pms_tenants_renters: {
      user_id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    pms_properties: {
      address: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[send-overdue-alerts] Starting overdue alerts job...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // 1. Obtener configuración de notificaciones activas
    const { data: notificationSettings } = await supabaseClient
      .from('pms_notification_settings')
      .select('*')
      .eq('enable_overdue_alerts', true);

    console.log(`[send-overdue-alerts] Found ${notificationSettings?.length} tenants with overdue alerts enabled`);

    let totalSent = 0;
    let totalFailed = 0;
    const today = new Date().toISOString().split('T')[0];

    // 2. Para cada tenant con notificaciones activas
    for (const setting of notificationSettings || []) {
      console.log(`[send-overdue-alerts] Processing tenant: ${setting.tenant_id}`);

      // 3. Buscar pagos vencidos (overdue) que vencen hoy
      const { data: overdueItems, error: itemsError } = await supabaseClient
        .from('pms_payment_schedule_items')
        .select(`
          id,
          tenant_id,
          contract_id,
          period_date,
          expected_amount,
          item,
          pms_contracts!inner (
            contract_number,
            tenant_renter_id,
            pms_tenants_renters!inner (
              user_id,
              first_name,
              last_name,
              email
            ),
            pms_properties!inner (
              address
            )
          )
        `)
        .eq('tenant_id', setting.tenant_id)
        .in('status', ['pending', 'overdue', 'partial'])
        .eq('period_date', today) as { data: OverdueItem[] | null, error: any };

      if (itemsError) {
        console.error('[send-overdue-alerts] Error fetching overdue items:', itemsError);
        continue;
      }

      console.log(`[send-overdue-alerts] Found ${overdueItems?.length || 0} overdue payments for tenant`);

      // 4. Agrupar por contrato
      const contractsMap = new Map<string, OverdueItem[]>();
      overdueItems?.forEach(item => {
        if (!contractsMap.has(item.contract_id)) {
          contractsMap.set(item.contract_id, []);
        }
        contractsMap.get(item.contract_id)?.push(item);
      });

      // 5. Enviar alerta por contrato
      for (const [contractId, items] of contractsMap.entries()) {
        const firstItem = items[0];
        const contract = firstItem.pms_contracts;
        const tenant = contract.pms_tenants_renters;
        const property = contract.pms_properties;

        // Verificar si ya se envió alerta hoy para este contrato
        const { data: existingLog } = await supabaseClient
          .from('pms_notification_logs')
          .select('id')
          .eq('contract_id', contractId)
          .eq('notification_type', 'payment_overdue')
          .gte('created_at', today)
          .single();

        if (existingLog) {
          console.log(`[send-overdue-alerts] Alert already sent today for contract ${contractId}, skipping...`);
          continue;
        }

        // Calcular días de atraso
        const dueDate = new Date(firstItem.period_date);
        const todayDate = new Date();
        const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Solo enviar si efectivamente está vencido (días > 0)
        if (daysOverdue <= 0) {
          continue;
        }

        const totalAmount = items.reduce((sum, item) => sum + item.expected_amount, 0);

        // 6. Obtener template
        const { data: template } = await supabaseClient
          .from('pms_email_templates')
          .select('*')
          .eq('tenant_id', setting.tenant_id)
          .eq('template_type', 'payment_overdue')
          .eq('is_active', true)
          .single();

        if (!template) {
          console.warn('[send-overdue-alerts] No template found for tenant, skipping...');
          continue;
        }

        // 7. Reemplazar variables
        const paymentUrl = `${Deno.env.get('SITE_URL') || 'https://wealthmanagement.lovable.app'}/pms/my-contract`;
        
        let htmlBody = template.html_body
          .replace(/{{tenant_name}}/g, `${tenant.first_name} ${tenant.last_name}`)
          .replace(/{{property_address}}/g, property.address)
          .replace(/{{contract_number}}/g, contract.contract_number)
          .replace(/{{amount}}/g, totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 }))
          .replace(/{{currency}}/g, 'ARS')
          .replace(/{{due_date}}/g, dueDate.toLocaleDateString('es-AR'))
          .replace(/{{days_overdue}}/g, daysOverdue.toString())
          .replace(/{{payment_url}}/g, paymentUrl);

        let subject = template.subject
          .replace(/{{contract_number}}/g, contract.contract_number);

        // 8. Enviar email
        try {
          const { data: emailResult, error: emailError } = await resend.emails.send({
            from: 'PMS Notificaciones <notifications@resend.dev>',
            to: [tenant.email],
            subject,
            html: htmlBody,
          });

          if (emailError) {
            console.error('[send-overdue-alerts] Error sending email:', emailError);
            totalFailed++;

            await supabaseClient.from('pms_notification_logs').insert({
              tenant_id: setting.tenant_id,
              notification_type: 'payment_overdue',
              schedule_item_id: firstItem.id,
              contract_id: contractId,
              recipient_email: tenant.email,
              recipient_user_id: tenant.user_id,
              subject,
              template_id: template.id,
              status: 'failed',
              error_message: emailError.message,
              metadata: { 
                items_count: items.length,
                days_overdue: daysOverdue 
              },
            });
          } else {
            console.log(`[send-overdue-alerts] Email sent successfully to ${tenant.email}`);
            totalSent++;

            await supabaseClient.from('pms_notification_logs').insert({
              tenant_id: setting.tenant_id,
              notification_type: 'payment_overdue',
              schedule_item_id: firstItem.id,
              contract_id: contractId,
              recipient_email: tenant.email,
              recipient_user_id: tenant.user_id,
              subject,
              template_id: template.id,
              status: 'sent',
              sent_at: new Date().toISOString(),
              metadata: { 
                items_count: items.length,
                days_overdue: daysOverdue,
                email_id: emailResult?.id 
              },
            });
          }
        } catch (error: any) {
          console.error('[send-overdue-alerts] Exception sending email:', error);
          totalFailed++;
        }
      }
    }

    console.log(`[send-overdue-alerts] Job completed. Sent: ${totalSent}, Failed: ${totalFailed}`);

    return new Response(
      JSON.stringify({
        success: true,
        total_sent: totalSent,
        total_failed: totalFailed,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[send-overdue-alerts] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
