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
        throw authError;
      }

      authUser = newUser.user;
      console.log('Created new auth user:', authUser.id);

      // Send welcome email (to be implemented)
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          email,
          first_name,
          password: tempPassword
        }
      });
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
      throw clientUserError;
    }

    console.log('PROPIETARIO user created successfully');

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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
