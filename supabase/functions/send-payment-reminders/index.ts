import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleItem {
  id: string;
  tenant_id: string;
  contract_id: string;
  period_date: string;
  expected_amount: number;
  item: string;
  owner_id: string;
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
    console.log('[send-payment-reminders] Starting payment reminders job...');

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
      .eq('enable_payment_reminders', true);

    console.log(`[send-payment-reminders] Found ${notificationSettings?.length} tenants with reminders enabled`);

    let totalSent = 0;
    let totalFailed = 0;

    // 2. Para cada tenant con notificaciones activas
    for (const setting of notificationSettings || []) {
      console.log(`[send-payment-reminders] Processing tenant: ${setting.tenant_id}`);

      // Calcular fecha objetivo (reminder_days_before días desde hoy)
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + setting.reminder_days_before);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      console.log(`[send-payment-reminders] Looking for payments due on: ${targetDateStr}`);

      // 3. Buscar pagos pendientes que vencen en N días
      const { data: scheduleItems, error: itemsError } = await supabaseClient
        .from('pms_payment_schedule_items')
        .select(`
          id,
          tenant_id,
          contract_id,
          period_date,
          expected_amount,
          item,
          owner_id,
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
        .eq('status', 'pending')
        .eq('period_date', targetDateStr) as { data: ScheduleItem[] | null, error: any };

      if (itemsError) {
        console.error('[send-payment-reminders] Error fetching schedule items:', itemsError);
        continue;
      }

      console.log(`[send-payment-reminders] Found ${scheduleItems?.length || 0} pending payments for tenant`);

      // 4. Agrupar por contrato para no enviar múltiples emails por el mismo contrato
      const contractsMap = new Map<string, ScheduleItem[]>();
      scheduleItems?.forEach(item => {
        if (!contractsMap.has(item.contract_id)) {
          contractsMap.set(item.contract_id, []);
        }
        contractsMap.get(item.contract_id)?.push(item);
      });

      // 5. Enviar un email por contrato
      for (const [contractId, items] of contractsMap.entries()) {
        const firstItem = items[0];
        const contract = firstItem.pms_contracts;
        const tenant = contract.pms_tenants_renters;
        const property = contract.pms_properties;

        // Calcular monto total del contrato (suma de items A y B)
        const totalAmount = items.reduce((sum, item) => sum + item.expected_amount, 0);

        // 6. Obtener template (custom o default)
        const { data: template } = await supabaseClient
          .from('pms_email_templates')
          .select('*')
          .eq('tenant_id', setting.tenant_id)
          .eq('template_type', 'payment_reminder')
          .eq('is_active', true)
          .single();

        if (!template) {
          console.warn('[send-payment-reminders] No template found for tenant, skipping...');
          continue;
        }

        // 7. Reemplazar variables en el template
        const paymentUrl = `${Deno.env.get('SITE_URL') || 'https://wealthmanagement.lovable.app'}/pms/my-contract`;
        
        let htmlBody = template.html_body
          .replace(/{{tenant_name}}/g, `${tenant.first_name} ${tenant.last_name}`)
          .replace(/{{property_address}}/g, property.address)
          .replace(/{{contract_number}}/g, contract.contract_number)
          .replace(/{{amount}}/g, totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 }))
          .replace(/{{currency}}/g, 'ARS')
          .replace(/{{due_date}}/g, new Date(firstItem.period_date).toLocaleDateString('es-AR'))
          .replace(/{{days_until_due}}/g, setting.reminder_days_before.toString())
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
            console.error('[send-payment-reminders] Error sending email:', emailError);
            totalFailed++;

            // Log failed notification
            await supabaseClient.from('pms_notification_logs').insert({
              tenant_id: setting.tenant_id,
              notification_type: 'payment_reminder',
              schedule_item_id: firstItem.id,
              contract_id: contractId,
              recipient_email: tenant.email,
              recipient_user_id: tenant.user_id,
              subject,
              template_id: template.id,
              status: 'failed',
              error_message: emailError.message,
              metadata: { items_count: items.length },
            });
          } else {
            console.log(`[send-payment-reminders] Email sent successfully to ${tenant.email}`);
            totalSent++;

            // Log successful notification
            await supabaseClient.from('pms_notification_logs').insert({
              tenant_id: setting.tenant_id,
              notification_type: 'payment_reminder',
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
                email_id: emailResult?.id 
              },
            });
          }
        } catch (error: any) {
          console.error('[send-payment-reminders] Exception sending email:', error);
          totalFailed++;
        }
      }
    }

    console.log(`[send-payment-reminders] Job completed. Sent: ${totalSent}, Failed: ${totalFailed}`);

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
    console.error('[send-payment-reminders] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
