import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Calculate date 7 days from now
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const targetDate = sevenDaysFromNow.toISOString().split('T')[0];

    console.log(`Checking for scheduled activations on ${targetDate}`);

    // Find scheduled subscriptions starting in 7 days that haven't been reminded
    const { data: scheduledActivations, error: activationsError } = await supabaseAdmin
      .from("tenant_subscriptions")
      .select(`
        *,
        tenant:pms_tenants(
          *,
          admin_email
        ),
        plan:subscription_plans(*),
        invoices:subscription_invoices(*)
      `)
      .eq("status", "pending")
      .eq("start_date", targetDate)
      .is("activation_reminder_sent_at", null);

    if (activationsError) {
      console.error("Error fetching scheduled activations:", activationsError);
      throw activationsError;
    }

    console.log(`Found ${scheduledActivations?.length || 0} scheduled activations in 7 days`);

    let sentCount = 0;
    let errorCount = 0;

    for (const subscription of scheduledActivations || []) {
      try {
        const tenant = subscription.tenant;
        const plan = subscription.plan;
        const adminEmail = tenant.admin_email || tenant.settings?.contact_info?.email;

        if (!adminEmail) {
          console.error(`No admin email found for tenant ${tenant.id}`);
          errorCount++;
          continue;
        }

        // Get pending invoice
        const pendingInvoice = subscription.invoices?.find((inv: any) => inv.status === 'pending');
        const amount = pendingInvoice?.amount || (subscription.billing_cycle === 'annual' ? plan.annual_price : plan.monthly_price);
        const currency = plan.currency || 'USD';
        const invoiceNumber = pendingInvoice?.invoice_number || 'Pendiente';

        // Send reminder email
        const emailResponse = await resend.emails.send({
          from: "Granada Platform <notifications@granadaplatform.com>",
          to: [adminEmail],
          subject: "Su suscripción será activada pronto - Granada PMS",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .invoice-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
                  .amount { font-size: 36px; font-weight: bold; color: #667eea; }
                  .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                  .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
                  .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎉 ¡Su suscripción será activada pronto!</h1>
                  </div>
                  <div class="content">
                    <p>Estimado/a cliente de <strong>${tenant.name}</strong>,</p>
                    
                    <div class="info-box">
                      <strong>📅 Su suscripción está programada para activarse el ${new Date(subscription.start_date).toLocaleDateString('es-AR')}</strong>
                    </div>
                    
                    <p>Estamos emocionados de que haya elegido Granada PMS para gestionar sus propiedades. Para que su suscripción se active sin problemas en la fecha programada, necesitamos que complete el pago.</p>
                    
                    <h3>Detalles de su Suscripción:</h3>
                    
                    <div class="invoice-box">
                      <div style="margin-bottom: 15px;">
                        <strong>Plan:</strong> ${plan.name}
                      </div>
                      <div style="margin-bottom: 15px;">
                        <strong>Ciclo de facturación:</strong> ${subscription.billing_cycle === 'annual' ? 'Anual' : 'Mensual'}
                      </div>
                      <div style="margin-bottom: 15px;">
                        <strong>Número de Factura:</strong> ${invoiceNumber}
                      </div>
                      <div style="margin-bottom: 15px;">
                        <strong>Fecha de inicio:</strong> ${new Date(subscription.start_date).toLocaleDateString('es-AR')}
                      </div>
                      <div style="margin-bottom: 15px;">
                        <strong>Fecha de fin:</strong> ${new Date(subscription.end_date).toLocaleDateString('es-AR')}
                      </div>
                      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                      <div style="text-align: center;">
                        <div style="color: #666; margin-bottom: 10px;">Monto Total</div>
                        <div class="amount">${currency} ${amount.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <h3>Pasos para activar su suscripción:</h3>
                    <ol>
                      <li>Realice la transferencia bancaria o pago por el monto indicado</li>
                      <li>Ingrese a su panel de suscripción en Granada PMS</li>
                      <li>Suba el comprobante de pago</li>
                      <li>Nuestro equipo verificará el pago y activará su cuenta automáticamente</li>
                    </ol>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://69d9919c-2220-47ba-955d-bf2b097e14dc.lovableproject.com/pms-login" class="button">
                        Subir Comprobante de Pago
                      </a>
                    </div>
                    
                    <p><strong>Información bancaria para transferencias:</strong><br>
                    <em>(Agregue aquí los datos bancarios de Granada)</em></p>
                    
                    <p><strong>¿Tiene preguntas?</strong><br>
                    Estamos aquí para ayudarle. Contáctenos respondiendo a este email.</p>
                    
                    <p>Gracias por confiar en Granada PMS.</p>
                    
                    <p>Saludos cordiales,<br>
                    <strong>El equipo de Granada PMS</strong></p>
                  </div>
                  <div class="footer">
                    <p>Este es un mensaje automático. Por favor no responda a este email.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        console.log(`Activation reminder sent to ${adminEmail} for subscription ${subscription.id}:`, emailResponse);

        // Mark reminder as sent
        await supabaseAdmin
          .from("tenant_subscriptions")
          .update({ activation_reminder_sent_at: new Date().toISOString() })
          .eq("id", subscription.id);

        sentCount++;
      } catch (emailError) {
        console.error(`Error sending reminder for subscription ${subscription.id}:`, emailError);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Scheduled activation reminders processed`,
        sent: sentCount,
        errors: errorCount,
        total: scheduledActivations?.length || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-scheduled-activation-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
