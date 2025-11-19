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

    // Calculate date 5 days from now
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    const targetDate = fiveDaysFromNow.toISOString().split('T')[0];

    console.log(`Checking for trials expiring on ${targetDate}`);

    // Find trial subscriptions expiring in 5 days that haven't been reminded
    const { data: expiringTrials, error: trialsError } = await supabaseAdmin
      .from("tenant_subscriptions")
      .select(`
        *,
        tenant:pms_tenants(
          *,
          admin_email
        ),
        plan:subscription_plans(*)
      `)
      .eq("is_trial", true)
      .eq("status", "trial")
      .eq("end_date", targetDate)
      .is("trial_reminder_sent_at", null);

    if (trialsError) {
      console.error("Error fetching expiring trials:", trialsError);
      throw trialsError;
    }

    console.log(`Found ${expiringTrials?.length || 0} trials expiring in 5 days`);

    let sentCount = 0;
    let errorCount = 0;

    for (const subscription of expiringTrials || []) {
      try {
        const tenant = subscription.tenant;
        const plan = subscription.plan;
        const adminEmail = tenant.admin_email || tenant.settings?.contact_info?.email;

        if (!adminEmail) {
          console.error(`No admin email found for tenant ${tenant.id}`);
          errorCount++;
          continue;
        }

        const monthlyPrice = plan.monthly_price || 0;
        const annualPrice = plan.annual_price || 0;
        const currency = plan.currency || 'USD';

        // Send reminder email
        const emailResponse = await resend.emails.send({
          from: "Granada PMS <onboarding@resend.dev>",
          to: [adminEmail],
          subject: "Su período de prueba está por vencer - Granada PMS",
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
                  .price-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
                  .price { font-size: 32px; font-weight: bold; color: #667eea; }
                  .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                  .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
                  .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>¡Su período de prueba está por vencer!</h1>
                  </div>
                  <div class="content">
                    <p>Estimado/a cliente de <strong>${tenant.name}</strong>,</p>
                    
                    <div class="warning">
                      <strong>⏰ Su período de prueba gratuito vence el ${new Date(subscription.end_date).toLocaleDateString('es-AR')}</strong>
                    </div>
                    
                    <p>Esperamos que haya disfrutado probando Granada PMS. Para continuar usando todas las funcionalidades de nuestra plataforma sin interrupciones, le invitamos a activar su suscripción.</p>
                    
                    <h3>Planes Disponibles:</h3>
                    
                    <div class="price-box">
                      <strong>Plan ${plan.name}</strong>
                      <div style="margin: 15px 0;">
                        <div style="margin: 10px 0;">
                          📅 <strong>Mensual:</strong> <span class="price">${currency} ${monthlyPrice.toLocaleString()}</span>/mes
                        </div>
                        <div style="margin: 10px 0;">
                          📅 <strong>Anual:</strong> <span class="price">${currency} ${annualPrice.toLocaleString()}</span>/año
                          ${annualPrice < monthlyPrice * 12 ? '<span style="color: #10b981; font-weight: bold;"> ¡Ahorre ' + Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100) + '%!</span>' : ''}
                        </div>
                      </div>
                    </div>
                    
                    <h3>Próximos pasos:</h3>
                    <ol>
                      <li>Ingrese a su panel de suscripción en Granada PMS</li>
                      <li>Revise las facturas pendientes</li>
                      <li>Realice el pago de su suscripción preferida (mensual o anual)</li>
                      <li>Suba el comprobante de pago en el sistema</li>
                      <li>Nuestro equipo verificará el pago y activará su suscripción</li>
                    </ol>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://69d9919c-2220-47ba-955d-bf2b097e14dc.lovableproject.com/pms-login" class="button">
                        Ir a Mi Suscripción
                      </a>
                    </div>
                    
                    <p><strong>¿Necesita ayuda?</strong><br>
                    Contáctenos respondiendo a este email o visitando nuestra página de contacto.</p>
                    
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

        console.log(`Reminder sent to ${adminEmail} for subscription ${subscription.id}:`, emailResponse);

        // Mark reminder as sent
        await supabaseAdmin
          .from("tenant_subscriptions")
          .update({ trial_reminder_sent_at: new Date().toISOString() })
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
        message: `Trial reminders processed`,
        sent: sentCount,
        errors: errorCount,
        total: expiringTrials?.length || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-trial-reminder:", error);
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
