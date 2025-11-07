import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[send-staff-overdue-alerts] Starting staff alerts job...');

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
      .eq('enable_staff_alerts', true)
      .eq('notify_staff', true);

    console.log(`[send-staff-overdue-alerts] Found ${notificationSettings?.length} tenants with staff alerts enabled`);

    let totalSent = 0;
    let totalFailed = 0;
    const today = new Date().toISOString().split('T')[0];

    // 2. Para cada tenant
    for (const setting of notificationSettings || []) {
      console.log(`[send-staff-overdue-alerts] Processing tenant: ${setting.tenant_id}`);

      // Verificar si ya se envió alerta hoy para este tenant
      const { data: existingLog } = await supabaseClient
        .from('pms_notification_logs')
        .select('id')
        .eq('tenant_id', setting.tenant_id)
        .eq('notification_type', 'staff_alert')
        .gte('created_at', today)
        .single();

      if (existingLog) {
        console.log(`[send-staff-overdue-alerts] Alert already sent today for tenant, skipping...`);
        continue;
      }

      // 3. Contar pagos vencidos
      const { data: overdueItems, error: itemsError } = await supabaseClient
        .from('pms_payment_schedule_items')
        .select('id, expected_amount')
        .eq('tenant_id', setting.tenant_id)
        .in('status', ['overdue', 'partial'])
        .lt('period_date', today);

      if (itemsError) {
        console.error('[send-staff-overdue-alerts] Error fetching overdue items:', itemsError);
        continue;
      }

      const overdueCount = overdueItems?.length || 0;

      // Si no hay pagos vencidos, no enviar alerta
      if (overdueCount === 0) {
        console.log(`[send-staff-overdue-alerts] No overdue payments for tenant, skipping...`);
        continue;
      }

      const totalOverdueAmount = overdueItems?.reduce((sum, item) => sum + item.expected_amount, 0) || 0;

      console.log(`[send-staff-overdue-alerts] Found ${overdueCount} overdue payments totaling ${totalOverdueAmount}`);

      // 4. Obtener emails del staff (INMOBILIARIA y ADMINISTRADOR)
      const { data: staffRoles } = await supabaseClient
        .from('user_roles')
        .select(`
          user_id,
          role,
          auth.users!inner (
            email
          )
        `)
        .eq('tenant_id', setting.tenant_id)
        .eq('module', 'PMS')
        .in('role', ['INMOBILIARIA', 'ADMINISTRADOR', 'SUPERADMIN'])
        .eq('status', 'approved');

      if (!staffRoles || staffRoles.length === 0) {
        console.warn('[send-staff-overdue-alerts] No staff users found for tenant, skipping...');
        continue;
      }

      // 5. Obtener template
      const { data: template } = await supabaseClient
        .from('pms_email_templates')
        .select('*')
        .eq('tenant_id', setting.tenant_id)
        .eq('template_type', 'staff_alert')
        .eq('is_active', true)
        .single();

      if (!template) {
        console.warn('[send-staff-overdue-alerts] No template found for tenant, skipping...');
        continue;
      }

      // 6. Reemplazar variables
      const dashboardUrl = `${Deno.env.get('SITE_URL') || 'https://wealthmanagement.lovable.app'}/pms/payments`;
      
      let htmlBody = template.html_body
        .replace(/{{overdue_count}}/g, overdueCount.toString())
        .replace(/{{total_overdue_amount}}/g, `ARS ${totalOverdueAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`)
        .replace(/{{dashboard_url}}/g, dashboardUrl);

      const subject = template.subject;

      // 7. Enviar a todos los staff members
      for (const staffRole of staffRoles) {
        const staffEmail = (staffRole as any).auth?.users?.email;
        
        if (!staffEmail) {
          console.warn('[send-staff-overdue-alerts] No email found for staff user, skipping...');
          continue;
        }

        try {
          const { data: emailResult, error: emailError } = await resend.emails.send({
            from: 'PMS Alertas <notifications@resend.dev>',
            to: [staffEmail],
            subject,
            html: htmlBody,
          });

          if (emailError) {
            console.error('[send-staff-overdue-alerts] Error sending email:', emailError);
            totalFailed++;

            await supabaseClient.from('pms_notification_logs').insert({
              tenant_id: setting.tenant_id,
              notification_type: 'staff_alert',
              schedule_item_id: null,
              contract_id: null,
              recipient_email: staffEmail,
              recipient_user_id: staffRole.user_id,
              subject,
              template_id: template.id,
              status: 'failed',
              error_message: emailError.message,
              metadata: { 
                overdue_count: overdueCount,
                total_overdue_amount: totalOverdueAmount 
              },
            });
          } else {
            console.log(`[send-staff-overdue-alerts] Email sent successfully to ${staffEmail}`);
            totalSent++;

            await supabaseClient.from('pms_notification_logs').insert({
              tenant_id: setting.tenant_id,
              notification_type: 'staff_alert',
              schedule_item_id: null,
              contract_id: null,
              recipient_email: staffEmail,
              recipient_user_id: staffRole.user_id,
              subject,
              template_id: template.id,
              status: 'sent',
              sent_at: new Date().toISOString(),
              metadata: { 
                overdue_count: overdueCount,
                total_overdue_amount: totalOverdueAmount,
                email_id: emailResult?.id 
              },
            });
          }
        } catch (error: any) {
          console.error('[send-staff-overdue-alerts] Exception sending email:', error);
          totalFailed++;
        }
      }
    }

    console.log(`[send-staff-overdue-alerts] Job completed. Sent: ${totalSent}, Failed: ${totalFailed}`);

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
    console.error('[send-staff-overdue-alerts] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
