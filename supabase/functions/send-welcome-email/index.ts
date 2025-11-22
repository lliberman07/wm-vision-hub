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
  password?: string; // Optional, only for new user creation
  is_reset?: boolean;
  platform?: 'pms' | 'granada';
  magic_link?: string; // For password recovery
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, first_name, password, is_reset = false, platform = 'pms', magic_link }: WelcomeEmailRequest = await req.json();

    // Get frontend URL from environment
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://jrzeabjpxkhccopxfwqa.lovableproject.com';

    const templates = {
      pms: {
        subject: is_reset ? "Recuperación de Contraseña - Sistema PMS" : "¡Bienvenido al Sistema PMS de WM Real Estate!",
        heading: is_reset ? `Recupera tu contraseña, ${first_name}` : `¡Bienvenido al PMS, ${first_name}!`,
        intro: is_reset 
          ? "Recibimos tu solicitud para recuperar tu contraseña del Sistema PMS." 
          : "Tu solicitud de acceso al Sistema de Gestión de Propiedades (PMS) ha sido aprobada.",
        loginUrl: `${frontendUrl}/pms/login`,
        resetUrl: `${frontendUrl}/pms/reset-password`
      },
      granada: {
        subject: is_reset ? "Recuperación de Contraseña - Granada Platform" : "¡Bienvenido a Granada Platform!",
        heading: is_reset ? `Recupera tu contraseña, ${first_name}` : `¡Bienvenido a Granada Platform, ${first_name}!`,
        intro: is_reset
          ? "Recibimos tu solicitud para recuperar tu contraseña de Granada Platform."
          : "Tu cuenta de administrador en Granada Platform ha sido creada exitosamente.",
        loginUrl: `${frontendUrl}/granada-admin/login`,
        resetUrl: `${frontendUrl}/granada-admin/reset-password`
      }
    };

    const template = templates[platform];

    // Email HTML content - different for magic link vs new user
    let emailHtml;

    if (is_reset && magic_link) {
      // Password recovery email with magic link
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; }
            .button { display: inline-block; padding: 16px 40px; background: #4CAF50; color: white !important; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; font-size: 16px; }
            .button:hover { background: #45a049; }
            .info-box { background: #f5f5f5; padding: 20px; margin: 25px 0; border-left: 4px solid #4CAF50; border-radius: 4px; }
            .warning-box { background: #fff9e6; padding: 20px; margin: 25px 0; border-left: 4px solid #ffa000; border-radius: 4px; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 13px; border-top: 1px solid #e0e0e0; }
            .link-text { word-break: break-all; color: #666; font-size: 13px; padding: 15px; background: #f9f9f9; border-radius: 4px; margin-top: 15px; }
            h1 { margin: 0; font-size: 28px; }
            .emoji { font-size: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${template.heading}</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px;">${template.intro}</p>
              
              <div class="info-box">
                <p style="margin: 0;"><strong>Haz clic en el siguiente botón para crear una nueva contraseña:</strong></p>
              </div>
              
              <div style="text-align: center;">
                <a href="${magic_link}" class="button">✨ Crear Nueva Contraseña</a>
              </div>
              
              <div class="warning-box">
                <p style="margin: 0;"><span class="emoji">⏱️</span> <strong>Este link es válido por 1 hora</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Después de 1 hora deberás solicitar un nuevo link de recuperación.</p>
              </div>
              
              <p style="font-size: 14px; color: #666;">Si el botón no funciona, copia y pega el siguiente link en tu navegador:</p>
              <div class="link-text">${magic_link}</div>
              
              <div style="margin-top: 30px; padding-top: 25px; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 14px;"><strong>🔒 Seguridad:</strong></p>
                <p style="font-size: 14px; color: #666; margin: 5px 0;">Si no solicitaste este cambio de contraseña, ignora este email. Tu cuenta está segura.</p>
              </div>
              
              <p style="margin-top: 30px;">Saludos cordiales,<br><strong>El equipo de WM Real Estate</strong></p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              <p style="margin-top: 10px;">¿Necesitas ayuda? Contáctanos a través de nuestro sitio web.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (password) {
      // New user welcome email with temporary password
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; }
            .credentials { background: #f5f5f5; padding: 25px; margin: 25px 0; border-left: 4px solid #4CAF50; border-radius: 4px; }
            .button { display: inline-block; padding: 16px 40px; background: #4CAF50; color: white !important; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; font-size: 16px; }
            .button:hover { background: #45a049; }
            .warning-box { background: #fff9e6; padding: 20px; margin: 25px 0; border-left: 4px solid #ffa000; border-radius: 4px; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 13px; border-top: 1px solid #e0e0e0; }
            h1 { margin: 0; font-size: 28px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${template.heading}</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px;">${template.intro}</p>
              
              <div class="credentials">
                <h3 style="margin: 0 0 15px 0;">Tus credenciales de acceso:</h3>
                <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0;"><strong>Contraseña temporal:</strong> <code style="background: white; padding: 4px 8px; border-radius: 3px; font-size: 14px;">${password}</code></p>
              </div>
              
              <div class="warning-box">
                <p style="margin: 0;"><strong>⚠️ Importante:</strong> Por seguridad, te recomendamos cambiar esta contraseña temporal después de tu primer inicio de sesión.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${template.loginUrl}" class="button">Iniciar Sesión</a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 25px;">Si el botón no funciona, accede directamente a:</p>
              <p style="font-size: 13px; color: #666; word-break: break-all; background: #f9f9f9; padding: 10px; border-radius: 4px;">${template.loginUrl}</p>
              
              <p style="margin-top: 30px;">Si tienes alguna duda o problema para acceder, no dudes en contactarnos.</p>
              <p style="margin-top: 20px;">Saludos cordiales,<br><strong>El equipo de WM Real Estate</strong></p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      throw new Error('Se requiere magic_link (para recovery) o password (para nuevos usuarios)');
    }

    const emailResponse = await resend.emails.send({
      from: "Granada Platform <noreply@granadaplatform.com>",
      to: [email],
      subject: template.subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

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
