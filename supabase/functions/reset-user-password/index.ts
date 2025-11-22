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

    const { user_id, email } = await req.json();
    
    let userId = user_id;

    // Si no se proporciona user_id pero sí email, buscar el user_id
    if (!userId && email) {
      const { data: authUsers, error: searchError } = await supabase.auth.admin.listUsers();
      if (!searchError && authUsers) {
        const foundUser = authUsers.users.find(u => u.email === email);
        if (foundUser) {
          userId = foundUser.id;
        }
      }
    }

    if (!userId) {
      throw new Error('user_id or email is required');
    }

    // Get user data to validate
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      throw new Error('Usuario no encontrado');
    }

    // Use the email from request body (already declared at line 20)

    // Generate new temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    );

    if (updateError) {
      throw updateError;
    }

    // Check if it's a Granada user
    const { data: granadaUser } = await supabase
      .from('granada_platform_users')
      .select('role')
      .eq('user_id', userId)
      .single();

    const isGranadaUser = !!granadaUser;

    // Get frontend URL from environment or construct from Supabase URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';
    const frontendUrl = `https://${projectId}.lovableproject.com`;
    
    // Generate password reset link with 7 days expiry
    const { data: resetData, error: resetLinkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: isGranadaUser 
          ? `${frontendUrl}/granada-admin/reset-password`
          : `${frontendUrl}/pms/reset-password`,
        // Link expires in 7 days (604800 seconds)
        expiresIn: 604800
      }
    });

    if (resetLinkError) {
      console.error('Error generating reset link:', resetLinkError);
    }

    // Send email with new temporary password AND reset link
    const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        email,
        first_name: userData.user.user_metadata?.first_name || 'Usuario',
        password: tempPassword,
        is_reset: true,
        platform: isGranadaUser ? 'granada' : 'pms',
        reset_link: resetData?.properties?.action_link
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
