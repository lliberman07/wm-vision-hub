import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalConfirmationRequest {
  email: string;
  first_name: string;
  role: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, first_name, role, language = 'es' }: ApprovalConfirmationRequest = await req.json();

    console.log("Sending approval confirmation to:", email);

    const roleNames: Record<string, string> = {
      'PROPIETARIO': 'Propietario',
      'INQUILINO': 'Inquilino',
      'INMOBILIARIA': 'Administrador de Inmobiliaria',
      'SUPERADMIN': 'Super Administrador'
    };

    const roleName = roleNames[role] || role;

    const emailResponse = await resend.emails.send({
      from: "WM Real Estate <onboarding@resend.dev>",
      to: [email],
      subject: language === 'en' ? "Your PMS Access Has Been Approved!" : "¡Tu acceso al PMS fue aprobado!",
      html: language === 'en' ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to the PMS System!</h1>
          
          <p>Hello ${first_name},</p>
          
          <p>Your request for access to the <strong>Property Management System (PMS)</strong> has been successfully approved.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Assigned Role:</strong> ${roleName}</p>
          </div>
          
          <h2 style="color: #1f2937;">System Access</h2>
          <p>You can access the system using the <strong>credentials you already have</strong> in your WM Real Estate account.</p>
          
          <div style="margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://wm-real-estate.lovable.app'}/pms/login" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access PMS System
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <h3 style="color: #1f2937;">Forgot Your Password?</h3>
          <p>Don't worry, you can easily recover it:</p>
          <ol>
            <li>Go to the login page</li>
            <li>Click on "Forgot your password?"</li>
            <li>Follow the instructions you'll receive by email</li>
          </ol>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions or need help, please don't hesitate to contact us.
          </p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>WM Real Estate Team</strong>
          </p>
        </div>
      ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">¡Bienvenido al Sistema PMS!</h1>
          
          <p>Hola ${first_name},</p>
          
          <p>Tu solicitud de acceso al <strong>Sistema de Gestión de Propiedades (PMS)</strong> ha sido aprobada exitosamente.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Rol asignado:</strong> ${roleName}</p>
          </div>
          
          <h2 style="color: #1f2937;">Acceso al Sistema</h2>
          <p>Puedes acceder al sistema utilizando las <strong>credenciales que ya tienes</strong> en tu cuenta de WM Real Estate.</p>
          
          <div style="margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://wm-real-estate.lovable.app'}/pms/login" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Acceder al Sistema PMS
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <h3 style="color: #1f2937;">¿Olvidaste tu contraseña?</h3>
          <p>No te preocupes, puedes recuperarla fácilmente:</p>
          <ol>
            <li>Ve a la página de inicio de sesión</li>
            <li>Haz clic en "¿Olvidaste tu contraseña?"</li>
            <li>Sigue las instrucciones que recibirás por email</li>
          </ol>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
          </p>
          
          <p style="margin-top: 30px;">
            Saludos,<br>
            <strong>Equipo WM Real Estate</strong>
          </p>
        </div>
      `,
    });

    console.log("Approval confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-approval-confirmation function:", error);
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
