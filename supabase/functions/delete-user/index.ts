import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeleteUserRequest {
  user_id: string;
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

// Función auxiliar para verificar rol superadmin
async function checkSuperAdminRole(supabaseClient: any, userId: string) {
  const { data, error } = await supabaseClient.rpc('has_role', {
    _user_id: userId,
    _role: 'superadmin'
  });

  if (error || !data) {
    return { isSuperAdmin: false, error: error || { message: 'Role check failed' } };
  }

  return { isSuperAdmin: data, error: null };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticación JWT
    const { user, error: authError, supabaseClient } = await authenticateUser(req);

    if (authError || !user) {
      console.error('[delete-user] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que sea superadmin
    const { isSuperAdmin, error: roleError } = await checkSuperAdminRole(supabaseClient, user.id);

    if (!isSuperAdmin || roleError) {
      console.error('[delete-user] Forbidden: User is not superadmin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden', details: 'Solo superadmins pueden eliminar usuarios' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[delete-user] Authenticated superadmin: ${user.id}`);

    const { user_id }: DeleteUserRequest = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

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

    // Delete user from auth.users (this will cascade to user_roles and users tables)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw new Error('No se pudo eliminar el usuario: ' + deleteError.message);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Usuario eliminado exitosamente'
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
    console.error("Error in delete-user function:", error);
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
