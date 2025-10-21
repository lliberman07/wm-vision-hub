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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, first_name, password }: WelcomeEmailRequest = await req.json();

    console.log('Sending welcome email to:', email);

    const emailResponse = await resend.emails.send({
      from: "WM Real Estate <onboarding@resend.dev>",
      to: [email],
      subject: "¡Bienvenido al Sistema PMS de WM Real Estate!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">¡Bienvenido al PMS, ${first_name}!</h1>
          
          <p>Tu solicitud de acceso al Sistema de Gestión de Propiedades (PMS) ha sido aprobada.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1f2937;">Tus Credenciales de Acceso</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Contraseña Temporal:</strong> <code style="background-color: #fff; padding: 4px 8px; border-radius: 4px;">${password}</code></p>
          </div>
          
          <p><strong>⚠️ Importante:</strong> Por tu seguridad, te recomendamos cambiar esta contraseña temporal en tu primer inicio de sesión.</p>
          
          <p>Para acceder al sistema:</p>
          <ol>
            <li>Visita <a href="https://wm-real-estate.lovable.app/pms/login">https://wm-real-estate.lovable.app/pms/login</a></li>
            <li>Ingresa con tu email y contraseña temporal</li>
            <li>Cambia tu contraseña desde el perfil</li>
          </ol>
          
          <p>Si tienes alguna pregunta o problema para acceder, no dudes en contactarnos.</p>
          
          <p style="margin-top: 30px;">Saludos,<br><strong>Equipo WM Real Estate</strong></p>
        </div>
      `,
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
