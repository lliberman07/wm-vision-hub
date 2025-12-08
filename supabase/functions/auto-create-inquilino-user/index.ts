import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateInquilinoRequest {
  contract_id: string;
  tenant_id: string;
  tenant_renter_id: string;
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

    const { contract_id, tenant_id, tenant_renter_id } = await req.json() as CreateInquilinoRequest;

    console.log('Creating INQUILINO user for contract:', contract_id);

    // Helper function for logging
    const logEvent = async (
      eventType: string,
      eventStatus: string,
      targetEmail: string,
      targetUserId: string | null = null,
      existingTenants: any[] = [],
      errorMessage: string | null = null
    ) => {
      try {
        await supabase.rpc('log_user_linking_event', {
          p_event_type: eventType,
          p_event_status: eventStatus,
          p_target_email: targetEmail,
          p_target_user_id: targetUserId,
          p_target_user_type: 'INQUILINO',
          p_target_tenant_id: tenant_id,
          p_is_cross_tenant_link: existingTenants.length > 0,
          p_existing_tenants: existingTenants,
          p_contract_id: contract_id,
          p_tenant_renter_id: tenant_renter_id,
          p_request_source: 'contract_activation',
          p_error_message: errorMessage
        });
      } catch (logError) {
        console.error('Failed to log event:', logError);
      }
    };

    // Get tenant renter info
    const { data: tenantRenter, error: renterError } = await supabase
      .from('pms_tenants_renters')
      .select('email, first_name, last_name, phone, document_number, user_id')
      .eq('id', tenant_renter_id)
      .single();

    if (renterError || !tenantRenter) {
      await logEvent('user_creation', 'failed', '', null, [], 'Tenant renter not found');
      throw new Error('Tenant renter not found');
    }

    let authUserId = tenantRenter.user_id;

    // Check if user exists in other tenants
    const { data: otherTenants } = await supabase
      .from('pms_client_users')
      .select('tenant_id, user_type, pms_tenants(name)')
      .eq('email', tenantRenter.email)
      .neq('tenant_id', tenant_id)
      .eq('is_active', true);

    const existingTenants = otherTenants?.map(t => ({
      tenant_id: t.tenant_id,
      tenant_name: (t as any).pms_tenants?.name || 'Unknown',
      user_type: t.user_type
    })) || [];

    // Check if user already exists in auth.users
    if (!authUserId) {
      const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
      const authUser = existingAuthUser?.users.find(u => u.email === tenantRenter.email);

      if (authUser) {
        authUserId = authUser.id;
        await logEvent('user_linking', 'success', tenantRenter.email, authUserId, existingTenants);
        
        // Update tenant renter with user_id
        await supabase
          .from('pms_tenants_renters')
          .update({ user_id: authUserId })
          .eq('id', tenant_renter_id);

        if (existingTenants.length > 0) {
          await logEvent('cross_tenant_detected', 'warning', tenantRenter.email, authUserId, existingTenants);
        }
      } else {
        // Create auth user
        const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
        const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
          email: tenantRenter.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: tenantRenter.first_name,
            last_name: tenantRenter.last_name,
            user_type: 'INQUILINO'
          }
        });

        if (authError) {
          console.error('Error creating auth user:', authError);
          await logEvent('user_creation', 'failed', tenantRenter.email, null, [], authError.message);
          throw authError;
        }

        authUserId = newUser.user.id;
        console.log('Created new auth user:', authUserId);
        await logEvent('user_creation', 'success', tenantRenter.email, authUserId, existingTenants);

        // Update tenant renter with user_id
        await supabase
          .from('pms_tenants_renters')
          .update({ user_id: authUserId })
          .eq('id', tenant_renter_id);

        // Send welcome email
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: tenantRenter.email,
            first_name: tenantRenter.first_name,
            password: tempPassword
          }
        });
      }
    }

    // Check if client user already exists
    const { data: existingClientUser } = await supabase
      .from('pms_client_users')
      .select('id, is_active')
      .eq('user_id', authUserId)
      .eq('tenant_id', tenant_id)
      .eq('user_type', 'INQUILINO')
      .eq('contract_id', contract_id)
      .single();

    if (existingClientUser) {
      // Reactivate if inactive
      if (!existingClientUser.is_active) {
        await supabase
          .from('pms_client_users')
          .update({ 
            is_active: true,
            deactivated_at: null,
            deactivated_by: null
          })
          .eq('id', existingClientUser.id);
        
        console.log('INQUILINO user reactivated');
        await logEvent('user_reactivation', 'success', tenantRenter.email, authUserId, existingTenants);
      } else {
        console.log('INQUILINO user already exists and is active');
      }

      // Notify if cross-tenant and send notification
      if (existingTenants.length > 0) {
        await supabase.functions.invoke('send-user-linked-notification', {
          body: {
            target_email: tenantRenter.email,
            target_tenant_id: tenant_id,
            event_type: 'user_linking',
            existing_tenants: existingTenants,
            contract_id
          }
        });
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User already exists',
          user_id: authUserId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client user record
    const { error: clientUserError } = await supabase
      .from('pms_client_users')
      .insert({
        user_id: authUserId,
        email: tenantRenter.email,
        tenant_id,
        user_type: 'INQUILINO',
        first_name: tenantRenter.first_name,
        last_name: tenantRenter.last_name,
        phone: tenantRenter.phone,
        cuit_cuil: tenantRenter.document_number,
        contract_id,
        is_active: true
      });

    if (clientUserError) {
      console.error('Error creating client user:', clientUserError);
      await logEvent('user_linking', 'failed', tenantRenter.email, authUserId, existingTenants, clientUserError.message);
      throw clientUserError;
    }

    console.log('INQUILINO user created successfully');
    await logEvent('user_linking', 'success', tenantRenter.email, authUserId, existingTenants);

    // Send notification if cross-tenant
    if (existingTenants.length > 0) {
      await supabase.functions.invoke('send-user-linked-notification', {
        body: {
          target_email: tenantRenter.email,
          target_tenant_id: tenant_id,
          event_type: 'user_linking',
          existing_tenants: existingTenants,
          contract_id
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authUserId,
        message: 'INQUILINO user created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-create-inquilino-user:', error);
    
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
        p_target_user_type: 'INQUILINO',
        p_request_source: 'contract_activation',
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
