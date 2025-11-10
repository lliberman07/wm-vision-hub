import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmationRequest {
  email: string;
  name: string;
  company_name: string;
  amount: number;
  paid_date: string;
  next_billing_date: string;
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
      amount,
      paid_date,
      next_billing_date
    }: PaymentConfirmationRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "WM Property Management <onboarding@resend.dev>",
      to: [email],
      subject: "Pago confirmado - WM PMS",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
            .success-icon { font-size: 48px; margin: 20px 0; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            td { padding: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>¡Pago Confirmado!</h1>
            </div>
            
            <div class="content">
              <p>Hola <strong>${name}</strong>,</p>
              
              <p>Hemos confirmado el pago de tu suscripción para <strong>${company_name}</strong>.</p>
              
              <div class="box">
                <h3>💰 Detalles del Pago</h3>
                <table>
                  <tr>
                    <td><strong>Monto:</strong></td>
                    <td>ARS $${amount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Fecha de pago:</strong></td>
                    <td>${new Date(paid_date).toLocaleDateString('es-AR')}</td>
                  </tr>
                  <tr>
                    <td><strong>Próxima facturación:</strong></td>
                    <td>${new Date(next_billing_date).toLocaleDateString('es-AR')}</td>
                  </tr>
                </table>
              </div>
              
              <div class="box">
                <h3>🎉 Tu suscripción está activa</h3>
                <p>Ya puedes disfrutar de todas las funcionalidades de tu plan sin restricciones.</p>
                <p>Recuerda que puedes ver el estado de tu suscripción en cualquier momento desde tu panel de administración.</p>
              </div>
              
              <center>
                <a href="https://tu-dominio.com/pms" class="button">Ir al Sistema</a>
              </center>
              
              <p>Gracias por confiar en nosotros.</p>
              
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

    console.log("Payment confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending payment confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
