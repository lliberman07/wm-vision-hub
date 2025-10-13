import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationEmailRequest {
  email: string;
  type: 'draft' | 'completed' | 'approved' | 'denied';
  resumeCode?: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, resumeCode, language = 'en' }: ApplicationEmailRequest = await req.json();

    console.log(`Sending ${type} email to: ${email}`);

    let subject: string;
    let htmlContent: string;

    const baseUrl = "https://jrzeabjpxkhccopxfwqa.supabase.co";
    const resumeLink = resumeCode ? `${baseUrl}/financing/apply?resume=${resumeCode}` : '';

    switch (type) {
      case 'draft':
        subject = language === 'es' ? 'Tu solicitud de financiamiento está incompleta' : 'Your financing application is incomplete';
        htmlContent = language === 'es' ? `
          <h1>Hola!</h1>
          <p>Tu aplicación de financiamiento está incompleta y no será evaluada hasta completarla.</p>
          <p>Para continuar con tu solicitud, utiliza este enlace:</p>
          <p><a href="${resumeLink}" style="color: #2754C5; text-decoration: underline;">Continuar solicitud</a></p>
          <p>Código de continuación: <strong>${resumeCode}</strong></p>
          <p>Saludos cordiales,<br>El equipo de WM Management</p>
        ` : `
          <h1>Hello!</h1>
          <p>Your financing application is incomplete and will not be evaluated until completed.</p>
          <p>To continue with your application, use this link:</p>
          <p><a href="${resumeLink}" style="color: #2754C5; text-decoration: underline;">Continue Application</a></p>
          <p>Resume code: <strong>${resumeCode}</strong></p>
          <p>Best regards,<br>The WM Management Team</p>
        `;
        break;

      case 'completed':
        subject = language === 'es' ? 'Solicitud de financiamiento recibida' : 'Financing application received';
        htmlContent = language === 'es' ? `
          <h1>¡Gracias por enviar tu solicitud!</h1>
          <p>Gracias por enviar tu solicitud de financiamiento. Nuestro equipo la evaluará y nos pondremos en contacto contigo pronto.</p>
          <p>Código de referencia: <strong>${resumeCode}</strong></p>
          <p>Saludos cordiales,<br>El equipo de WM Management</p>
        ` : `
          <h1>Thank you for your submission!</h1>
          <p>Thank you for submitting your financing application. Our team will evaluate it and get back to you soon.</p>
          <p>Reference code: <strong>${resumeCode}</strong></p>
          <p>Best regards,<br>The WM Management Team</p>
        `;
        break;

      case 'approved':
        subject = language === 'es' ? 'Tu solicitud de financiamiento fue aprobada' : 'Your financing application was approved';
        htmlContent = language === 'es' ? `
          <h1>¡Felicitaciones!</h1>
          <p>Tu solicitud de financiamiento fue aprobada.</p>
          <p>Nuestro equipo se pondrá en contacto contigo para continuar con el proceso.</p>
          <p>Saludos cordiales,<br>El equipo de WM Management</p>
        ` : `
          <h1>Congratulations!</h1>
          <p>Your financing application was approved.</p>
          <p>Our team will contact you to continue with the process.</p>
          <p>Best regards,<br>The WM Management Team</p>
        `;
        break;

      case 'denied':
        subject = language === 'es' ? 'Tu solicitud de financiamiento fue rechazada' : 'Your financing application was denied';
        htmlContent = language === 'es' ? `
          <h1>Hola!</h1>
          <p>Lamentamos informarte que tu solicitud de financiamiento fue rechazada.</p>
          <p>Si tienes preguntas sobre esta decisión, por favor contacta a nuestro equipo.</p>
          <p>Saludos cordiales,<br>El equipo de WM Management</p>
        ` : `
          <h1>Hello!</h1>
          <p>We regret to inform you that your financing application was denied.</p>
          <p>If you have questions about this decision, please contact our team.</p>
          <p>Best regards,<br>The WM Management Team</p>
        `;
        break;
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
    console.error("Error in send-application-email function:", error);
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