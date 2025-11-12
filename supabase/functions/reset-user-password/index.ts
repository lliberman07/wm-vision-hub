import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

    // Get user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !userData.user) {
      throw new Error('Usuario no encontrado');
    }

    const email = userData.user.email;

    // Generate new temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user_id,
      { password: tempPassword }
    );

    if (updateError) {
      throw updateError;
    }

    // Send email with new password (reuse send-welcome-email)
    const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        email,
        first_name: userData.user.user_metadata?.first_name || 'Usuario',
        password: tempPassword,
        is_reset: true
      }
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Contraseña reseteada y email enviado'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reset-user-password:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
