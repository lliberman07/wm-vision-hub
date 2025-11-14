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
  source: 'wm' | 'granada';
}

// Branding configuration for dual platform support
const brandingConfig = {
  wm: {
    fromName: 'WM Management',
    fromEmail: 'noreply@wmglobal.co',
    websiteUrl: 'https://wmglobal.co',
    supportEmail: 'contacto@wmglobal.co',
  },
  granada: {
    fromName: 'Granada Platform',
    fromEmail: 'noreply@granadaplatform.com',
    websiteUrl: 'https://granadaplatform.com',
    supportEmail: 'contacto@granadaplatform.com',
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, language, source = 'wm' }: ContactConfirmationRequest = await req.json();
    const branding = brandingConfig[source];

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar longitud de campos
    if (!firstName || firstName.length > 100 || !lastName || lastName.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Name fields are required and must be less than 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Email content based on language and source
    const emailContent = source === 'granada'
      ? (language === 'es' 
          ? {
              subject: "¡Tu consulta ha sido recibida! - Granada Platform",
              greeting: `¡Hola ${firstName}!`,
              message: `Gracias por tu interés en <strong>Granada Platform</strong>.<br><br>Hemos recibido tu consulta y nuestro equipo la revisará a la brevedad.<br>Te contactaremos en las próximas 24-48 horas hábiles.<br><br><strong>¿Qué sigue?</strong><ul><li>📋 Revisaremos tu consulta en detalle</li><li>📞 Te contactaremos para agendar una demostración personalizada</li><li>💡 Te mostraremos cómo Granada puede transformar tu gestión inmobiliaria</li></ul>Mientras tanto, puedes explorar nuestra plataforma en: <a href="${branding.websiteUrl}">${branding.websiteUrl}</a>`,
              thanks: "¡Gracias por confiar en Granada Platform!",
              signature: "Atentamente,<br>El equipo de Granada Platform"
            }
          : {
              subject: "Your inquiry has been received! - Granada Platform",
              greeting: `Hello ${firstName}!`,
              message: `Thank you for your interest in <strong>Granada Platform</strong>.<br><br>We have received your inquiry and our team will review it promptly.<br>We will contact you within the next 24-48 business hours.<br><br><strong>What's next?</strong><ul><li>📋 We will review your inquiry in detail</li><li>📞 We will contact you to schedule a personalized demo</li><li>💡 We will show you how Granada can transform your real estate management</li></ul>In the meantime, you can explore our platform at: <a href="${branding.websiteUrl}">${branding.websiteUrl}</a>`,
              thanks: "Thank you for trusting Granada Platform!",
              signature: "Best regards,<br>The Granada Platform Team"
            })
      : (language === 'es' 
          ? {
              subject: "Tu consulta ya está en WM Management!",
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
            });

    const emailResponse = await resend.emails.send({
      from: `${branding.fromName} <${branding.fromEmail}>`,
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