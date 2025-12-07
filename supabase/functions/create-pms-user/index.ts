import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, first_name, last_name, company_name }: CreateUserRequest = await req.json();

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

    // Primero verificar si el usuario ya existe
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      throw new Error('Error al verificar usuarios existentes: ' + listError.message);
    }

    const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      // Usuario ya existe, retornar su ID sin crear nuevo
      console.log(`User ${email} already exists with ID ${existingUser.id}`);
      return new Response(
        JSON.stringify({ 
          user_id: existingUser.id,
          is_existing: true,
          temp_password: null
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Usuario no existe, crear nuevo
    const tempPassword = crypto.randomUUID().substring(0, 12);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        entity_type: company_name ? 'empresa' : 'persona',
        company_name,
      }
    });

    if (authError) {
      throw new Error('No se pudo crear la cuenta de usuario: ' + authError.message);
    }

    console.log(`Created new user ${email} with ID ${authData.user.id}`);

    return new Response(
      JSON.stringify({ 
        user_id: authData.user.id,
        is_existing: false,
        temp_password: tempPassword
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
    console.error("Error in create-pms-user function:", error);
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
