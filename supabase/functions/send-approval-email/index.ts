import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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

// Función auxiliar para verificar autenticación JWT
async function authenticateUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { 
      user: null, 
      error: { message: 'Missing or invalid authorization header', code: 'MISSING_AUTH' } 
    };
  }

  const token = authHeader.replace('Bearer ', '');
  
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      },
      auth: {
        persistSession: false,
      }
    }
  );

  const { data: { user }, error } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    return { 
      user: null, 
      error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' } 
    };
  }

  return { user, error: null, supabaseClient };
}

// Función auxiliar para verificar roles admin
async function checkAdminRole(supabaseClient: any, userId: string) {
  const { data: isSuperAdmin } = await supabaseClient.rpc('has_role', {
    _user_id: userId,
    _role: 'superadmin'
  });
  
  const { data: isAdmin } = await supabaseClient.rpc('has_role', {
    _user_id: userId,
    _role: 'admin'
  });

  return { isAdmin: isSuperAdmin || isAdmin };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticación JWT
    const { user, error: authError, supabaseClient } = await authenticateUser(req);

    if (authError || !user) {
      console.error('[send-approval-email] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que sea admin o superadmin
    const { isAdmin } = await checkAdminRole(supabaseClient, user.id);

    if (!isAdmin) {
      console.error('[send-approval-email] Forbidden: User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden', details: 'Requiere rol de administrador' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-approval-email] Authenticated admin: ${user.id}`);

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