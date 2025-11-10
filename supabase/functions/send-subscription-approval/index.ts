import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  email: string;
  name: string;
  company_name: string;
  plan_name: string;
  trial_days: number;
  amount: number;
  billing_cycle: string;
  due_date: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      name, 
      company_name,
      plan_name, 
      trial_days, 
      amount,
      billing_cycle,
      due_date
    }: ApprovalEmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "WM Property Management <onboarding@resend.dev>",
      to: [email],
      subject: "¡Tu suscripción ha sido aprobada! - WM PMS",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .highlight { color: #667eea; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            td { padding: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a WM PMS!</h1>
              <p>Tu suscripción ha sido aprobada</p>
            </div>
            
            <div class="content">
              <p>Hola <strong>${name}</strong>,</p>
              
              <p>¡Excelentes noticias! Tu solicitud de suscripción para <strong>${company_name}</strong> ha sido aprobada.</p>
              
              <div class="box">
                <h3>📋 Detalles de tu Plan</h3>
                <table>
                  <tr>
                    <td><strong>Plan:</strong></td>
                    <td>${plan_name}</td>
                  </tr>
                  <tr>
                    <td><strong>Período de prueba:</strong></td>
                    <td class="highlight">${trial_days} días gratis</td>
                  </tr>
                  <tr>
                    <td><strong>Ciclo de facturación:</strong></td>
                    <td>${billing_cycle === 'yearly' ? 'Anual' : 'Mensual'}</td>
                  </tr>
                  <tr>
                    <td><strong>Monto:</strong></td>
                    <td>ARS $${amount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Vencimiento factura:</strong></td>
                    <td>${new Date(due_date).toLocaleDateString('es-AR')}</td>
                  </tr>
                </table>
              </div>
              
              <div class="box">
                <h3>💳 Información de Pago</h3>
                <p>Para continuar usando el sistema después del período de prueba, realiza la transferencia a:</p>
                <table>
                  <tr>
                    <td><strong>Titular:</strong></td>
                    <td>WM Property Management</td>
                  </tr>
                  <tr>
                    <td><strong>CUIT:</strong></td>
                    <td>XX-XXXXXXXX-X</td>
                  </tr>
                  <tr>
                    <td><strong>CBU:</strong></td>
                    <td>XXXXXXXXXXXXXXXXXXXXXXXX</td>
                  </tr>
                  <tr>
                    <td><strong>Alias:</strong></td>
                    <td>WM.PROPERTY.MP</td>
                  </tr>
                  <tr>
                    <td><strong>Concepto:</strong></td>
                    <td>Suscripción ${plan_name} - ${company_name}</td>
                  </tr>
                </table>
                <p><strong>Importante:</strong> Una vez realizado el pago, sube el comprobante desde tu panel de suscripción.</p>
              </div>
              
              <center>
                <a href="https://tu-dominio.com/pms" class="button">Acceder al Sistema</a>
              </center>
              
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              
              <p>Saludos,<br><strong>Equipo WM Property Management</strong></p>
            </div>
            
            <div class="footer">
              <p>Este es un correo automático, por favor no responder.</p>
              <p>© ${new Date().getFullYear()} WM Property Management. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending approval email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
