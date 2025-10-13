import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  email: string;
  action: 'approved' | 'denied';
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action, language = 'en' }: ApprovalEmailRequest = await req.json();

    console.log(`Sending ${action} email to: ${email}`);

    let subject: string;
    let htmlContent: string;

    if (action === 'approved') {
      subject = language === 'es' ? 'Tu acceso de administrador fue aprobado' : 'Your admin access was approved';
      htmlContent = language === 'es' ? `
        <h1>¡Hola!</h1>
        <p>Tu acceso de administrador a WM Management ha sido aprobado.</p>
        <p>Ahora puedes iniciar sesión en el panel de administración usando la contraseña que configuraste durante el registro.</p>
        <p>Saludos cordiales,<br>El equipo de WM Management</p>
      ` : `
        <h1>Hello!</h1>
        <p>Your admin access to WM Management has been approved.</p>
        <p>You can now log in to the admin dashboard using the password you set at signup.</p>
        <p>Best regards,<br>The WM Management Team</p>
      `;
    } else {
      subject = language === 'es' ? 'Tu solicitud de acceso de administrador fue denegada' : 'Your admin access was denied';
      htmlContent = language === 'es' ? `
        <h1>Hola!</h1>
        <p>Tu solicitud de acceso de administrador a WM Management ha sido denegada.</p>
        <p>Si tienes preguntas sobre esta decisión, por favor contacta al administrador del sistema.</p>
        <p>Saludos cordiales,<br>El equipo de WM Management</p>
      ` : `
        <h1>Hello!</h1>
        <p>Your request for admin access to WM Management has been denied.</p>
        <p>If you have questions about this decision, please contact the system administrator.</p>
        <p>Best regards,<br>The WM Management Team</p>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "WM Management <noreply@wmglobal.co>",
      to: [email],
      subject: subject,
      html: htmlContent,
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
    console.error("Error in send-approval-email function:", error);
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