import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  request_id: string;
  action: 'approved' | 'rejected';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { request_id, action }: NotificationRequest = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no está configurado");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get change request details
    const { data: changeRequest, error: requestError } = await supabase
      .from('subscription_change_requests')
      .select(`
        *,
        pms_tenants!subscription_change_requests_tenant_id_fkey(name, email),
        current_plan:subscription_plans!subscription_change_requests_current_plan_id_fkey(name),
        requested_plan:subscription_plans!subscription_change_requests_requested_plan_id_fkey(name),
        pms_client_users!inner(email, first_name, last_name)
      `)
      .eq('id', request_id)
      .single();

    if (requestError || !changeRequest) {
      throw new Error('No se pudo encontrar la solicitud de cambio');
    }

    // Get client admin email
    const { data: clientUser } = await supabase
      .from('pms_client_users')
      .select('email, first_name')
      .eq('user_id', changeRequest.requested_by)
      .eq('tenant_id', changeRequest.tenant_id)
      .eq('user_type', 'CLIENT_ADMIN')
      .single();

    const recipientEmail = clientUser?.email || changeRequest.pms_tenants?.email;
    const recipientName = clientUser?.first_name || 'Cliente';

    if (!recipientEmail) {
      throw new Error('No se pudo determinar el email del destinatario');
    }

    // Prepare email content
    let subject: string;
    let htmlContent: string;

    if (action === 'approved') {
      subject = `✅ Cambio de Plan Aprobado - ${changeRequest.pms_tenants?.name || 'Granada PMS'}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
              .plan-box { background: white; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>¡Cambio de Plan Aprobado!</h1>
              </div>
              <div class="content">
                <p>Hola ${recipientName},</p>
                
                <p>Nos complace informarte que tu solicitud de cambio de plan ha sido <span class="success-badge">APROBADA</span></p>

                <div class="plan-box">
                  <h3 style="margin-top: 0; color: #10b981;">📊 Detalles del Cambio</h3>
                  <p><strong>Plan Anterior:</strong> ${changeRequest.current_plan?.name || 'N/A'}</p>
                  <p><strong>Nuevo Plan:</strong> ${changeRequest.requested_plan?.name || 'N/A'}</p>
                  <p><strong>Empresa:</strong> ${changeRequest.pms_tenants?.name || 'N/A'}</p>
                </div>

                <h3>🎯 Próximos Pasos:</h3>
                <ol>
                  <li>El cambio de plan es efectivo inmediatamente</li>
                  <li>Puedes acceder a todas las funcionalidades del nuevo plan</li>
                  <li>La facturación se ajustará en el próximo ciclo de pago</li>
                  <li>Revisa los nuevos límites y características en tu panel</li>
                </ol>

                ${changeRequest.reason ? `
                <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Tu motivo:</strong> "${changeRequest.reason}"</p>
                </div>
                ` : ''}

                <p style="margin-top: 30px;">Si tienes alguna pregunta, no dudes en contactarnos.</p>
                
                <p>¡Gracias por confiar en Granada PMS!</p>

                <div class="footer">
                  <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                  <p>© ${new Date().getFullYear()} Granada PMS. Todos los derechos reservados.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
    } else {
      subject = `❌ Cambio de Plan No Aprobado - ${changeRequest.pms_tenants?.name || 'Granada PMS'}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .rejected-badge { background: #ef4444; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
              .plan-box { background: white; border: 2px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Actualización de Solicitud de Cambio</h1>
              </div>
              <div class="content">
                <p>Hola ${recipientName},</p>
                
                <p>Lamentamos informarte que tu solicitud de cambio de plan ha sido <span class="rejected-badge">NO APROBADA</span></p>

                <div class="plan-box">
                  <h3 style="margin-top: 0; color: #ef4444;">📊 Detalles de la Solicitud</h3>
                  <p><strong>Plan Actual:</strong> ${changeRequest.current_plan?.name || 'N/A'}</p>
                  <p><strong>Plan Solicitado:</strong> ${changeRequest.requested_plan?.name || 'N/A'}</p>
                  <p><strong>Empresa:</strong> ${changeRequest.pms_tenants?.name || 'N/A'}</p>
                </div>

                ${changeRequest.reason ? `
                <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Tu motivo:</strong> "${changeRequest.reason}"</p>
                </div>
                ` : ''}

                <h3>💡 ¿Qué puedes hacer?</h3>
                <ul>
                  <li>Contacta con nuestro equipo para entender las razones</li>
                  <li>Solicita una reunión para discutir alternativas</li>
                  <li>Envía una nueva solicitud con información adicional</li>
                </ul>

                <p style="margin-top: 30px;">Estamos aquí para ayudarte. No dudes en contactarnos.</p>
                
                <p>Equipo de Granada PMS</p>

                <div class="footer">
                  <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                  <p>© ${new Date().getFullYear()} Granada PMS. Todos los derechos reservados.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Granada PMS <noreply@granadapms.com>",
        to: [recipientEmail],
        subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`Error al enviar email: ${error}`);
    }

    const emailData = await emailResponse.json();
    console.log('Email enviado exitosamente:', emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notificación enviada',
        emailId: emailData.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
