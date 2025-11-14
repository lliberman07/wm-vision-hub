import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
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

    const WM_TENANT_ID = "8c5b46df-6090-4383-8995-a201ce7e5f9e";
    const CLIENT_EMAIL = "wmclient@wmglobal.co";
    const CLIENT_PASSWORD = "WMClient2024!";

    // Check if user already exists
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingAuthUser?.users?.some(u => u.email === CLIENT_EMAIL);

    let userId: string;

    if (userExists) {
      const existingUser = existingAuthUser?.users?.find(u => u.email === CLIENT_EMAIL);
      userId = existingUser!.id;
      console.log("User already exists:", userId);
    } else {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: CLIENT_EMAIL,
        password: CLIENT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: "WM",
          last_name: "Client Admin",
          entity_type: 'empresa',
        }
      });

      if (authError) {
        throw new Error('Failed to create auth user: ' + authError.message);
      }

      userId = authData.user.id;
      console.log("Created new user:", userId);
    }

    // Check if CLIENT_ADMIN role exists in pms_client_users
    const { data: existingClientUser } = await supabaseAdmin
      .from('pms_client_users')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', WM_TENANT_ID)
      .eq('user_type', 'CLIENT_ADMIN')
      .maybeSingle();

    if (!existingClientUser) {
      // Insert CLIENT_ADMIN role in pms_client_users
      const { error: clientUserError } = await supabaseAdmin
        .from('pms_client_users')
        .insert({
          user_id: userId,
          tenant_id: WM_TENANT_ID,
          user_type: 'CLIENT_ADMIN',
          email: CLIENT_EMAIL,
          first_name: 'WM',
          last_name: 'Client Admin',
          is_active: true,
        });

      if (clientUserError) {
        throw new Error('Failed to create client user record: ' + clientUserError.message);
      }

      console.log("Created CLIENT_ADMIN record in pms_client_users");
    } else {
      console.log("CLIENT_ADMIN record already exists");
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: userId,
        email: CLIENT_EMAIL,
        message: userExists 
          ? "User already existed, verified CLIENT_ADMIN role" 
          : "Created new user with CLIENT_ADMIN role",
        credentials: {
          email: CLIENT_EMAIL,
          password: CLIENT_PASSWORD
        }
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
    console.error("Error in setup-wm-client-user function:", error);
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
