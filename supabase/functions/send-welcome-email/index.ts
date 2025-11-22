import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  first_name: string;
  password: string;
  is_reset?: boolean;
  platform?: 'pms' | 'granada';
  reset_link?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, first_name, password, is_reset = false, platform = 'pms', reset_link }: WelcomeEmailRequest = await req.json();

    const templates = {
      pms: {
        subject: is_reset ? "Contraseña restablecida - Sistema PMS WM Real Estate" : "¡Bienvenido al Sistema PMS de WM Real Estate!",
        heading: is_reset ? `Contraseña restablecida, ${first_name}` : `¡Bienvenido al PMS, ${first_name}!`,
        intro: is_reset 
          ? "Tu contraseña del Sistema PMS ha sido restablecida exitosamente." 
          : "Tu solicitud de acceso al Sistema de Gestión de Propiedades (PMS) ha sido aprobada.",
        loginUrl: "https://jrzeabjpxkhccopxfwqa.lovableproject.com/pms/login"
      },
      granada: {
        subject: is_reset ? "Contraseña restablecida - Granada Platform" : "¡Bienvenido a Granada Platform!",
        heading: is_reset ? `Contraseña restablecida, ${first_name}` : `¡Bienvenido a Granada Platform, ${first_name}!`,
        intro: is_reset
          ? "Tu contraseña de Granada Platform ha sido restablecida exitosamente."
          : "Tu cuenta de administrador en Granada Platform ha sido creada exitosamente.",
        loginUrl: "https://jrzeabjpxkhccopxfwqa.lovableproject.com/granada-admin/login"
      }
    };

    const template = templates[platform];

    const emailResponse = await resend.emails.send({
      from: "Granada Platform <noreply@granadaplatform.com>",
      to: [email],
      subject: template.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4CAF50; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${template.heading}</h1>
            </div>
            <div class="content">
              <p>${template.intro}</p>
              <div class="credentials">
                <h3>Tus credenciales de acceso:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Contraseña temporal:</strong> ${password}</p>
              </div>
              ${reset_link ? `
              <p><strong>🔗 Link directo para cambiar contraseña:</strong></p>
              <div style="text-align: center;">
                <a href="${reset_link}" class="button" style="background: #2196F3;">Cambiar Contraseña Ahora</a>
              </div>
              <p style="font-size: 12px; color: #666;">O también puedes iniciar sesión con las credenciales temporales y cambiar tu contraseña desde el menú de usuario.</p>
              ` : ''}
              <p><strong>⚠️ Importante:</strong> Por razones de seguridad, te recomendamos cambiar esta contraseña temporal después de tu primer inicio de sesión.</p>
              ${!reset_link ? `
              <div style="text-align: center;">
                <a href="${template.loginUrl}" class="button">Iniciar Sesión</a>
              </div>
              ` : ''}
              <p>Si tienes alguna duda o problema para acceder, no dudes en contactarnos.</p>
              <p>Saludos cordiales,<br><strong>El equipo de WM Real Estate</strong></p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
