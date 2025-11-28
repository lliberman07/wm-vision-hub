import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePropietarioRequest {
  owner_id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  cuit_cuil?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { owner_id, tenant_id, email, first_name, last_name, phone, cuit_cuil } = await req.json() as CreatePropietarioRequest;

    console.log('Creating PROPIETARIO user for owner:', owner_id);

    // Helper function for logging
    const logEvent = async (
      eventType: string,
      eventStatus: string,
      targetUserId: string | null = null,
      existingTenants: any[] = [],
      errorMessage: string | null = null
    ) => {
      try {
        await supabase.rpc('log_user_linking_event', {
          p_event_type: eventType,
          p_event_status: eventStatus,
          p_target_email: email,
          p_target_user_id: targetUserId,
          p_target_user_type: 'PROPIETARIO',
          p_target_tenant_id: tenant_id,
          p_is_cross_tenant_link: existingTenants.length > 0,
          p_existing_tenants: existingTenants,
          p_owner_id: owner_id,
          p_request_source: 'form',
          p_error_message: errorMessage
        });
      } catch (logError) {
        console.error('Failed to log event:', logError);
      }
    };

    // Check if user exists in other tenants
    const { data: otherTenants } = await supabase
      .from('pms_client_users')
      .select('tenant_id, user_type, pms_tenants(name)')
      .eq('email', email)
      .neq('tenant_id', tenant_id)
      .eq('is_active', true);

    const existingTenants = otherTenants?.map(t => ({
      tenant_id: t.tenant_id,
      tenant_name: (t as any).pms_tenants?.name || 'Unknown',
      user_type: t.user_type
    })) || [];

    // Check if user already exists in auth.users
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    let authUser = existingAuthUser?.users.find(u => u.email === email);

    // Create auth user if doesn't exist
    if (!authUser) {
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
      const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name,
          last_name,
          user_type: 'PROPIETARIO'
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        await logEvent('user_creation', 'failed', null, [], authError.message);
        throw authError;
      }

      authUser = newUser.user;
      console.log('Created new auth user:', authUser.id);
      await logEvent('user_creation', 'success', authUser.id, existingTenants);

      // Send welcome email
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          email,
          first_name,
          password: tempPassword
        }
      });
    } else {
      await logEvent('user_linking', 'success', authUser.id, existingTenants);
      
      if (existingTenants.length > 0) {
        await logEvent('cross_tenant_detected', 'warning', authUser.id, existingTenants);
      }
    }

    // Check if client user already exists
    const { data: existingClientUser } = await supabase
      .from('pms_client_users')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('tenant_id', tenant_id)
      .eq('user_type', 'PROPIETARIO')
      .single();

    if (existingClientUser) {
      console.log('PROPIETARIO user already exists');
      
      // Send notification if cross-tenant
      if (existingTenants.length > 0) {
        await supabase.functions.invoke('send-user-linked-notification', {
          body: {
            target_email: email,
            target_tenant_id: tenant_id,
            event_type: 'user_linking',
            existing_tenants: existingTenants,
            owner_id
          }
        });
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User already exists',
          user_id: authUser.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client user record
    const { error: clientUserError } = await supabase
      .from('pms_client_users')
      .insert({
        user_id: authUser.id,
        email,
        tenant_id,
        user_type: 'PROPIETARIO',
        first_name,
        last_name,
        phone,
        cuit_cuil,
        owner_id,
        is_active: true
      });

    if (clientUserError) {
      console.error('Error creating client user:', clientUserError);
      await logEvent('user_linking', 'failed', authUser.id, existingTenants, clientUserError.message);
      throw clientUserError;
    }

    console.log('PROPIETARIO user created successfully');
    await logEvent('user_linking', 'success', authUser.id, existingTenants);

    // Send notification if cross-tenant
    if (existingTenants.length > 0) {
      await supabase.functions.invoke('send-user-linked-notification', {
        body: {
          target_email: email,
          target_tenant_id: tenant_id,
          event_type: 'user_creation',
          existing_tenants: existingTenants,
          owner_id
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authUser.id,
        message: 'PROPIETARIO user created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-create-propietario-user:', error);
    
    // Try to log error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabase.rpc('log_user_linking_event', {
        p_event_type: 'user_creation',
        p_event_status: 'failed',
        p_target_email: '',
        p_target_user_type: 'PROPIETARIO',
        p_request_source: 'form',
        p_error_message: error.message
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
