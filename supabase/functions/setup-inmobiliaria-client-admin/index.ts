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

    console.log("Starting setup for INMOBILIARIA users as CLIENT_ADMIN...");

    // Find all users with INMOBILIARIA role in v_current_user_tenants
    const { data: inmobiliariaUsers, error: fetchError } = await supabaseAdmin
      .from('v_current_user_tenants')
      .select('user_id, tenant_id, email, roles');

    if (fetchError) {
      throw new Error('Failed to fetch users: ' + fetchError.message);
    }

    console.log(`Found ${inmobiliariaUsers?.length || 0} user-tenant relationships`);

    // Filter users with INMOBILIARIA role
    const usersToProcess = inmobiliariaUsers?.filter((userTenant: any) => {
      const roles = userTenant.roles || [];
      return roles.some((role: string) => role.toUpperCase() === 'INMOBILIARIA');
    }) || [];

    console.log(`Found ${usersToProcess.length} users with INMOBILIARIA role`);

    const results = [];
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const userTenant of usersToProcess) {
      try {
        // Check if CLIENT_ADMIN role already exists
        const { data: existingClientUser } = await supabaseAdmin
          .from('pms_client_users')
          .select('*')
          .eq('user_id', userTenant.user_id)
          .eq('tenant_id', userTenant.tenant_id)
          .eq('user_type', 'CLIENT_ADMIN')
          .maybeSingle();

        if (existingClientUser) {
          console.log(`Skipping ${userTenant.email} - CLIENT_ADMIN already exists`);
          skipped++;
          results.push({
            email: userTenant.email,
            tenant_id: userTenant.tenant_id,
            status: 'skipped',
            reason: 'CLIENT_ADMIN role already exists'
          });
          continue;
        }

        // Get user details from auth.users
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userTenant.user_id);
        
        const firstName = authUser?.user?.user_metadata?.first_name || 'User';
        const lastName = authUser?.user?.user_metadata?.last_name || 'Admin';

        // Create CLIENT_ADMIN record
        const { error: insertError } = await supabaseAdmin
          .from('pms_client_users')
          .insert({
            user_id: userTenant.user_id,
            tenant_id: userTenant.tenant_id,
            user_type: 'CLIENT_ADMIN',
            email: userTenant.email,
            first_name: firstName,
            last_name: lastName,
            is_active: true,
          });

        if (insertError) {
          console.error(`Error creating CLIENT_ADMIN for ${userTenant.email}:`, insertError);
          errors++;
          results.push({
            email: userTenant.email,
            tenant_id: userTenant.tenant_id,
            status: 'error',
            error: insertError.message
          });
        } else {
          console.log(`✓ Created CLIENT_ADMIN for ${userTenant.email}`);
          created++;
          results.push({
            email: userTenant.email,
            tenant_id: userTenant.tenant_id,
            status: 'created'
          });
        }
      } catch (error: any) {
        console.error(`Error processing ${userTenant.email}:`, error);
        errors++;
        results.push({
          email: userTenant.email,
          tenant_id: userTenant.tenant_id,
          status: 'error',
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        summary: {
          total_inmobiliaria_users: usersToProcess.length,
          created,
          skipped,
          errors
        },
        details: results
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
    console.error("Error in setup-inmobiliaria-client-admin function:", error);
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
