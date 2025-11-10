import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrialReminderRequest {
  email: string;
  name: string;
  company_name: string;
  days_remaining: number;
  amount: number;
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
      days_remaining,
      amount,
      due_date
    }: TrialReminderRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "WM Property Management <onboarding@resend.dev>",
      to: [email],
      subject: `⏰ Tu período de prueba finaliza en ${days_remaining} días - WM PMS`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
            .warning-icon { font-size: 48px; margin: 20px 0; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            td { padding: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="warning-icon">⏰</div>
              <h1>Recordatorio de Pago</h1>
            </div>
            
            <div class="content">
              <p>Hola <strong>${name}</strong>,</p>
              
              <div class="highlight">
                <p style="margin: 0; font-size: 18px; text-align: center;">
                  Tu período de prueba finaliza en <strong>${days_remaining} día${days_remaining !== 1 ? 's' : ''}</strong>
                </p>
              </div>
              
              <p>Para continuar usando <strong>WM PMS</strong> para <strong>${company_name}</strong> sin interrupciones, por favor realiza el pago antes del vencimiento.</p>
              
              <div class="box">
                <h3>💳 Información de Pago</h3>
                <table>
                  <tr>
                    <td><strong>Monto a pagar:</strong></td>
                    <td>ARS $${amount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Fecha de vencimiento:</strong></td>
                    <td>${new Date(due_date).toLocaleDateString('es-AR')}</td>
                  </tr>
                </table>
                
                <p><strong>Datos bancarios:</strong></p>
                <table>
                  <tr>
                    <td>Titular:</td>
                    <td>WM Property Management</td>
                  </tr>
                  <tr>
                    <td>CBU:</td>
                    <td>XXXXXXXXXXXXXXXXXXXXXXXX</td>
                  </tr>
                  <tr>
                    <td>Alias:</td>
                    <td>WM.PROPERTY.MP</td>
                  </tr>
                </table>
              </div>
              
              <div class="box">
                <h3>📤 Después de realizar el pago</h3>
                <p>1. Sube el comprobante desde tu panel de suscripción</p>
                <p>2. Nuestro equipo verificará el pago en menos de 24 horas</p>
                <p>3. Tu suscripción se activará automáticamente</p>
              </div>
              
              <center>
                <a href="https://tu-dominio.com/pms" class="button">Subir Comprobante</a>
              </center>
              
              <p>Si ya realizaste el pago, puedes ignorar este mensaje.</p>
              
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

    console.log("Trial reminder email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending trial reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
