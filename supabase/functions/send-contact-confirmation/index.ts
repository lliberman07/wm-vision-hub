import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ContactConfirmationRequest {
  firstName: string;
  lastName: string;
  email: string;
  language: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, language }: ContactConfirmationRequest = await req.json();

    // Email content based on language
    const emailContent = language === 'es' 
      ? {
          subject: "Tu consulta ya está en WM Management !",
          greeting: `Hola ${firstName} ${lastName},`,
          message: "Ya recibimos su mensaje y nuestro equipo se pondrá en contacto con usted.",
          thanks: "¡Gracias por su interés en WM Management!",
          signature: "Atentamente,<br>El equipo de WM Management"
        }
      : {
          subject: "Your inquiry has been received at WM Management!",
          greeting: `Hello ${firstName} ${lastName},`,
          message: "We have received your message and our team will contact you soon.",
          thanks: "Thank you for your interest in WM Management!",
          signature: "Best regards,<br>The WM Management Team"
        };

    const emailResponse = await resend.emails.send({
      from: "WM Management <noreply@wmglobal.co>",
      to: [email],
      subject: emailContent.subject,
      html: `
        <h1>${emailContent.greeting}</h1>
        <p>${emailContent.message}</p>
        <p>${emailContent.thanks}</p>
        <br>
        <p>${emailContent.signature}</p>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-confirmation function:", error);
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