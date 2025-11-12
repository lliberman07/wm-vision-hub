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

    // Get tenant renter info
    const { data: tenantRenter, error: renterError } = await supabase
      .from('pms_tenants_renters')
      .select('email, first_name, last_name, phone, document_id, user_id')
      .eq('id', tenant_renter_id)
      .single();

    if (renterError || !tenantRenter) {
      throw new Error('Tenant renter not found');
    }

    let authUserId = tenantRenter.user_id;

    // Check if user already exists in auth.users
    if (!authUserId) {
      const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
      const authUser = existingAuthUser?.users.find(u => u.email === tenantRenter.email);

      if (authUser) {
        authUserId = authUser.id;
        
        // Update tenant renter with user_id
        await supabase
          .from('pms_tenants_renters')
          .update({ user_id: authUserId })
          .eq('id', tenant_renter_id);
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
          throw authError;
        }

        authUserId = newUser.user.id;
        console.log('Created new auth user:', authUserId);

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
      } else {
        console.log('INQUILINO user already exists and is active');
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
        cuit_cuil: tenantRenter.document_id,
        contract_id,
        is_active: true
      });

    if (clientUserError) {
      console.error('Error creating client user:', clientUserError);
      throw clientUserError;
    }

    console.log('INQUILINO user created successfully');

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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
