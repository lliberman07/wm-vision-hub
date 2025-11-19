import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateGranadaUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, first_name, last_name, role }: CreateGranadaUserRequest = await req.json();

    console.log("Creating Granada platform user:", { email, first_name, last_name, role });

    // Crear cliente de Supabase con service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generar contraseña temporal segura
    const tempPassword = crypto.randomUUID().substring(0, 12) + 'Aa1!';

    // Crear usuario en auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role,
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw new Error('No se pudo crear la cuenta de usuario: ' + authError.message);
    }

    console.log("Auth user created successfully:", authData.user.id);

    // Crear registro en granada_platform_users
    const { error: platformUserError } = await supabaseAdmin
      .from('granada_platform_users')
      .insert({
        user_id: authData.user.id,
        email: email,
        first_name: first_name,
        last_name: last_name,
        role: role,
        is_active: true,
      });

    if (platformUserError) {
      console.error("Error creating platform user record:", platformUserError);
      throw new Error('No se pudo crear el registro de usuario: ' + platformUserError.message);
    }

    console.log("Platform user record created successfully");

    // Enviar email de bienvenida con credenciales
    const { error: emailError } = await supabaseAdmin.functions.invoke('send-welcome-email', {
      body: {
        email: email,
        first_name: first_name,
        password: tempPassword,
      },
    });

    if (emailError) {
      console.error("Error sending welcome email:", emailError);
      // No lanzar error aquí, el usuario ya fue creado exitosamente
    } else {
      console.log("Welcome email sent successfully");
    }

    return new Response(
      JSON.stringify({ 
        user_id: authData.user.id,
        temp_password: tempPassword,
        message: 'Usuario creado exitosamente'
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in create-granada-platform-user function:", error);
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
