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

    // Validación: No permitir eliminar al propio usuario
    if (user_id === user.id) {
      throw new Error('No puedes eliminar tu propio usuario');
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

    console.log(`[delete-user] Starting cleanup for user: ${user_id}`);
    
    const deletedData: any = {
      user_id,
      access_requests: 0,
      owners: 0,
      tenants_renters: 0,
      personal_tenants: [],
      warnings: []
    };

    // 1. Validar que no tenga contratos activos como propietario
    const { data: activeContracts, error: contractsError } = await supabaseAdmin
      .from('pms_contracts')
      .select('id, contract_number, status')
      .eq('status', 'active')
      .in('property_id', 
        supabaseAdmin
          .from('pms_owner_properties')
          .select('property_id')
          .in('owner_id',
            supabaseAdmin
              .from('pms_owners')
              .select('id')
              .eq('user_id', user_id)
          )
      );

    if (activeContracts && activeContracts.length > 0) {
      throw new Error(`No se puede eliminar: el usuario tiene ${activeContracts.length} contrato(s) activo(s) como propietario`);
    }

    // 2. Validar que no tenga contratos activos como inquilino
    const { data: tenantContracts, error: tenantContractsError } = await supabaseAdmin
      .from('pms_contracts')
      .select('id, contract_number, status')
      .eq('status', 'active')
      .in('tenant_renter_id',
        supabaseAdmin
          .from('pms_tenants_renters')
          .select('id')
          .eq('user_id', user_id)
      );

    if (tenantContracts && tenantContracts.length > 0) {
      throw new Error(`No se puede eliminar: el usuario tiene ${tenantContracts.length} contrato(s) activo(s) como inquilino`);
    }

    // 3. Eliminar access requests
    const { error: accessRequestsError, count: accessRequestsCount } = await supabaseAdmin
      .from('pms_access_requests')
      .delete({ count: 'exact' })
      .eq('user_id', user_id);

    if (!accessRequestsError && accessRequestsCount !== null) {
      deletedData.access_requests = accessRequestsCount;
      console.log(`[delete-user] Deleted ${accessRequestsCount} access requests`);
    }

    // 4. Buscar tenants personales del usuario (inquilino/propietario)
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('tenant_id, role')
      .eq('user_id', user_id)
      .eq('module', 'PMS')
      .in('role', ['PROPIETARIO', 'INQUILINO']);

    // 5. Para cada tenant, verificar si es personal y eliminarlo si corresponde
    if (userRoles && userRoles.length > 0) {
      for (const role of userRoles) {
        if (!role.tenant_id) continue;

        // Obtener info del tenant y contar usuarios
        const { data: tenant } = await supabaseAdmin
          .from('pms_tenants')
          .select('id, name, slug, tenant_type')
          .eq('id', role.tenant_id)
          .in('tenant_type', ['inquilino', 'propietario'])
          .single();

        if (!tenant) continue;

        // Contar usuarios del tenant
        const { count: userCount } = await supabaseAdmin
          .from('user_roles')
          .select('user_id', { count: 'exact', head: true })
          .eq('tenant_id', role.tenant_id)
          .eq('module', 'PMS')
          .eq('status', 'approved');

        // Solo eliminar si es el único usuario
        if (userCount === 1) {
          // Verificar que no tenga contratos
          const { count: contractCount } = await supabaseAdmin
            .from('pms_contracts')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', role.tenant_id);

          if (contractCount === 0) {
            const { error: deleteTenantError } = await supabaseAdmin
              .from('pms_tenants')
              .delete()
              .eq('id', role.tenant_id);

            if (!deleteTenantError) {
              deletedData.personal_tenants.push({
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                type: tenant.tenant_type
              });
              console.log(`[delete-user] Deleted personal tenant: ${tenant.slug}`);
            }
          } else {
            deletedData.warnings.push(`Tenant ${tenant.slug} no eliminado: tiene ${contractCount} contrato(s)`);
          }
        }
      }
    }

    // 6. Eliminar de pms_owners
    const { error: ownersError, count: ownersCount } = await supabaseAdmin
      .from('pms_owners')
      .delete({ count: 'exact' })
      .eq('user_id', user_id);

    if (!ownersError && ownersCount !== null) {
      deletedData.owners = ownersCount;
      console.log(`[delete-user] Deleted ${ownersCount} owner records`);
    }

    // 7. Eliminar de pms_tenants_renters
    const { error: rentersError, count: rentersCount } = await supabaseAdmin
      .from('pms_tenants_renters')
      .delete({ count: 'exact' })
      .eq('user_id', user_id);

    if (!rentersError && rentersCount !== null) {
      deletedData.tenants_renters = rentersCount;
      console.log(`[delete-user] Deleted ${rentersCount} renter records`);
    }

    // 8. Finalmente, eliminar el usuario (esto eliminará user_roles por cascade)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error('[delete-user] Error deleting user from auth:', deleteError);
      throw new Error('No se pudo eliminar el usuario de auth: ' + deleteError.message);
    }

    console.log(`[delete-user] Successfully deleted user ${user_id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Usuario eliminado exitosamente con cleanup completo',
        deleted: deletedData
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
    console.error("[delete-user] Error:", error);
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
