import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Días de gracia después del vencimiento antes de suspender
const GRACE_PERIOD_DAYS = 7;

interface SuspensionResult {
  trials_suspended: number;
  subscriptions_suspended: number;
  invoices_marked_overdue: number;
  notifications_sent: number;
  errors: string[];
}

async function sendSuspensionNotification(
  resend: Resend,
  email: string,
  tenantName: string,
  reason: 'trial_expired' | 'payment_overdue',
  invoiceNumber?: string,
  amount?: number,
  currency?: string
) {
  try {
    const isTrialExpired = reason === 'trial_expired';
    const subject = isTrialExpired 
      ? 'Tu período de prueba ha terminado' 
      : 'Suscripción suspendida por falta de pago';

    const formattedAmount = amount && currency 
      ? new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
      : '';

    await resend.emails.send({
      from: 'Granada WM <notificaciones@granadawm.com>',
      to: [email],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .cta-button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Suscripción Suspendida</h1>
              <p>Granada Wealth Management</p>
            </div>
            <div class="content">
              <p>Estimado/a cliente de <strong>${tenantName}</strong>,</p>
              
              ${isTrialExpired ? `
                <div class="alert-box">
                  <p><strong>Tu período de prueba ha finalizado.</strong></p>
                  <p>Para continuar utilizando la plataforma, por favor realiza el pago de tu suscripción.</p>
                </div>
              ` : `
                <div class="alert-box">
                  <p><strong>Tu suscripción ha sido suspendida por falta de pago.</strong></p>
                  ${invoiceNumber ? `<p>Factura pendiente: <strong>${invoiceNumber}</strong></p>` : ''}
                  ${formattedAmount ? `<p>Monto adeudado: <strong>${formattedAmount}</strong></p>` : ''}
                </div>
              `}
              
              <p>Mientras tu cuenta esté suspendida:</p>
              <ul>
                <li>No podrás acceder a las funcionalidades del sistema</li>
                <li>Tus datos permanecerán seguros y disponibles una vez regularices tu situación</li>
              </ul>
              
              <p>Para reactivar tu cuenta, por favor realiza el pago pendiente y contáctanos.</p>
              
              <p>Si tienes alguna consulta o necesitas asistencia, no dudes en contactarnos.</p>
              
              <div class="footer">
                <p>Este es un correo automático. Por favor no responda a este mensaje.</p>
                <p>© ${new Date().getFullYear()} Granada Wealth Management. Todos los derechos reservados.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`📧 Email de suspensión enviado a ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error enviando email de suspensión a ${email}:`, error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;
    const now = new Date();

    console.log('🔍 Ejecutando proceso de suspensión de suscripciones...');
    console.log(`📅 Fecha actual: ${now.toISOString()}`);

    const result: SuspensionResult = {
      trials_suspended: 0,
      subscriptions_suspended: 0,
      invoices_marked_overdue: 0,
      notifications_sent: 0,
      errors: [],
    };

    // 1. Suspender trials expirados sin pago
    console.log('📋 Buscando trials expirados...');
    
    const { data: expiredTrials, error: trialsError } = await supabase
      .from("tenant_subscriptions")
      .select(`
        id,
        tenant_id,
        trial_end,
        pms_tenants!inner (
          name,
          email
        )
      `)
      .eq("status", "trial")
      .lt("trial_end", now.toISOString());

    if (trialsError) {
      console.error("❌ Error buscando trials:", trialsError);
      result.errors.push(`Error buscando trials: ${trialsError.message}`);
    } else if (expiredTrials && expiredTrials.length > 0) {
      console.log(`📊 Encontrados ${expiredTrials.length} trials expirados`);

      for (const trial of expiredTrials) {
        // Verificar si tiene alguna factura pagada
        const { data: paidInvoices } = await supabase
          .from("subscription_invoices")
          .select("id")
          .eq("subscription_id", trial.id)
          .eq("status", "paid")
          .limit(1);

        if (!paidInvoices || paidInvoices.length === 0) {
          // Suspender la suscripción
          const { error: updateError } = await supabase
            .from("tenant_subscriptions")
            .update({ status: "suspended" })
            .eq("id", trial.id);

          if (updateError) {
            console.error(`❌ Error suspendiendo trial ${trial.id}:`, updateError);
            result.errors.push(`Error suspendiendo trial ${trial.id}`);
          } else {
            result.trials_suspended++;
            console.log(`✅ Trial suspendido: ${trial.id}`);

            // Enviar notificación
            const tenant = trial.pms_tenants as any;
            if (resend && tenant?.email) {
              const sent = await sendSuspensionNotification(
                resend,
                tenant.email,
                tenant.name || 'Cliente',
                'trial_expired'
              );
              if (sent) result.notifications_sent++;
            }
          }
        }
      }
    }

    // 2. Marcar facturas como vencidas
    console.log('📋 Buscando facturas pendientes vencidas...');
    
    const { data: overdueInvoices, error: overdueError } = await supabase
      .from("subscription_invoices")
      .select("id, invoice_number")
      .eq("status", "pending")
      .lt("due_date", now.toISOString().split('T')[0]);

    if (overdueError) {
      console.error("❌ Error buscando facturas vencidas:", overdueError);
      result.errors.push(`Error buscando facturas: ${overdueError.message}`);
    } else if (overdueInvoices && overdueInvoices.length > 0) {
      console.log(`📊 Encontradas ${overdueInvoices.length} facturas vencidas`);

      const invoiceIds = overdueInvoices.map(inv => inv.id);
      
      const { error: updateInvoicesError } = await supabase
        .from("subscription_invoices")
        .update({ status: "overdue" })
        .in("id", invoiceIds);

      if (updateInvoicesError) {
        console.error("❌ Error actualizando facturas:", updateInvoicesError);
        result.errors.push(`Error actualizando facturas: ${updateInvoicesError.message}`);
      } else {
        result.invoices_marked_overdue = overdueInvoices.length;
        console.log(`✅ ${overdueInvoices.length} facturas marcadas como vencidas`);
      }
    }

    // 3. Suspender suscripciones con facturas vencidas por más de X días
    console.log(`📋 Buscando suscripciones con facturas vencidas hace más de ${GRACE_PERIOD_DAYS} días...`);
    
    const gracePeriodDate = new Date(now);
    gracePeriodDate.setDate(gracePeriodDate.getDate() - GRACE_PERIOD_DAYS);
    
    const { data: delinquentSubscriptions, error: delinquentError } = await supabase
      .from("subscription_invoices")
      .select(`
        id,
        invoice_number,
        amount,
        currency,
        subscription_id,
        tenant_id,
        tenant_subscriptions!inner (
          id,
          status
        ),
        pms_tenants!inner (
          name,
          email
        )
      `)
      .eq("status", "overdue")
      .lt("due_date", gracePeriodDate.toISOString().split('T')[0])
      .in("tenant_subscriptions.status", ["active", "trial"]);

    if (delinquentError) {
      console.error("❌ Error buscando suscripciones morosas:", delinquentError);
      result.errors.push(`Error buscando morosos: ${delinquentError.message}`);
    } else if (delinquentSubscriptions && delinquentSubscriptions.length > 0) {
      console.log(`📊 Encontradas ${delinquentSubscriptions.length} suscripciones a suspender`);

      // Agrupar por subscription_id para evitar duplicados
      const subscriptionIds = [...new Set(delinquentSubscriptions.map(s => s.subscription_id))];

      for (const subscriptionId of subscriptionIds) {
        const invoice = delinquentSubscriptions.find(s => s.subscription_id === subscriptionId)!;
        
        const { error: suspendError } = await supabase
          .from("tenant_subscriptions")
          .update({ status: "suspended" })
          .eq("id", subscriptionId);

        if (suspendError) {
          console.error(`❌ Error suspendiendo suscripción ${subscriptionId}:`, suspendError);
          result.errors.push(`Error suspendiendo ${subscriptionId}`);
        } else {
          result.subscriptions_suspended++;
          console.log(`✅ Suscripción suspendida: ${subscriptionId}`);

          // Enviar notificación
          const tenant = invoice.pms_tenants as any;
          if (resend && tenant?.email) {
            const sent = await sendSuspensionNotification(
              resend,
              tenant.email,
              tenant.name || 'Cliente',
              'payment_overdue',
              invoice.invoice_number,
              invoice.amount,
              invoice.currency
            );
            if (sent) result.notifications_sent++;
          }
        }
      }
    }

    console.log('📊 Resultado final:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Proceso de suspensión completado",
        ...result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("❌ Error general:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
