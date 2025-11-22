import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limiting constants
const MAX_ATTEMPTS_PER_EMAIL_PER_HOUR = 3;
const MAX_ATTEMPTS_PER_IP_PER_HOUR = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let auditLog = {
    user_id: null as string | null,
    email: '',
    requested_by: null as string | null,
    ip_address: null as string | null,
    user_agent: null as string | null,
    success: false,
    error_message: null as string | null,
    tenant_id: null as string | null,
  };

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract IP and User Agent from request
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    auditLog.ip_address = ipAddress;
    auditLog.user_agent = userAgent;

    const { user_id, email, requested_by } = await req.json();
    
    let userId = user_id;
    let userEmail = email;

    // Si no se proporciona user_id pero sí email, buscar el user_id
    if (!userId && userEmail) {
      // Validate email format
      if (!EMAIL_REGEX.test(userEmail)) {
        throw new Error('Formato de email inválido');
      }

      const { data: authUsers, error: searchError } = await supabase.auth.admin.listUsers();
      if (!searchError && authUsers) {
        const foundUser = authUsers.users.find(u => u.email === userEmail);
        if (foundUser) {
          userId = foundUser.id;
        }
      }
    }

    if (!userId) {
      throw new Error('user_id o email es requerido');
    }

    // Get user data to validate
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      throw new Error('Usuario no encontrado');
    }

    // Get email from user data if not provided
    userEmail = userEmail || userData.user.email;
    
    if (!userEmail) {
      throw new Error('No se pudo obtener el email del usuario');
    }

    // Validate email format
    if (!EMAIL_REGEX.test(userEmail)) {
      throw new Error('Formato de email inválido');
    }

    auditLog.user_id = userId;
    auditLog.email = userEmail;
    auditLog.requested_by = requested_by;

    // Check if user is active
    if (userData.user.banned_until || userData.user.deleted_at) {
      throw new Error('La cuenta de usuario no está activa');
    }

    // RATE LIMITING: Check attempts by email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: emailAttempts, error: emailAttemptsError } = await supabase
      .from('password_reset_attempts')
      .select('*')
      .eq('email', userEmail)
      .gte('attempted_at', oneHourAgo);

    if (emailAttemptsError) {
      console.error('Error checking email rate limit:', emailAttemptsError);
    } else if (emailAttempts && emailAttempts.length >= MAX_ATTEMPTS_PER_EMAIL_PER_HOUR) {
      throw new Error(`Demasiados intentos para este email. Por favor, intenta en 1 hora.`);
    }

    // RATE LIMITING: Check attempts by IP
    const { data: ipAttempts, error: ipAttemptsError } = await supabase
      .from('password_reset_attempts')
      .select('*')
      .eq('ip_address', ipAddress)
      .gte('attempted_at', oneHourAgo);

    if (ipAttemptsError) {
      console.error('Error checking IP rate limit:', ipAttemptsError);
    } else if (ipAttempts && ipAttempts.length >= MAX_ATTEMPTS_PER_IP_PER_HOUR) {
      throw new Error(`Demasiados intentos desde esta dirección IP. Por favor, intenta en 1 hora.`);
    }

    // Generate cryptographically secure temporary password
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const base64Password = btoa(String.fromCharCode(...randomBytes))
      .replace(/\+/g, 'A')
      .replace(/\//g, 'B')
      .replace(/=/g, '')
      .slice(0, 12);
    const tempPassword = base64Password + 'Aa1!';

    console.log(`Generating secure temporary password for user: ${userId}`);

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw new Error('Error al actualizar la contraseña');
    }

    console.log(`Password updated successfully for user: ${userId}`);

    // Check if it's a Granada user
    const { data: granadaUser } = await supabase
      .from('granada_platform_users')
      .select('role, id')
      .eq('user_id', userId)
      .single();

    const isGranadaUser = !!granadaUser;

    // Get tenant_id if it's a PMS user
    let tenantId = null;
    if (!isGranadaUser) {
      const { data: pmsUser } = await supabase
        .from('pms_client_users')
        .select('tenant_id')
        .eq('user_id', userId)
        .single();
      
      tenantId = pmsUser?.tenant_id || null;
    }

    auditLog.tenant_id = tenantId;

    console.log(`Sending temporary password email to: ${userEmail}, isGranada: ${isGranadaUser}`);

    // Send email with ONLY temporary password (no recovery link)
    const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        email: userEmail,
        first_name: userData.user.user_metadata?.first_name || 'Usuario',
        password: tempPassword,
        is_reset: true,
        platform: isGranadaUser ? 'granada' : 'pms',
        // NO recovery link - user must login with temp password
      }
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw new Error('Error al enviar el email de confirmación');
    }

    // Record successful attempt
    auditLog.success = true;
    
    const duration = Date.now() - startTime;
    console.log(`Password reset successful for ${userEmail} in ${duration}ms`);

    // Log the attempt
    await supabase.from('password_reset_attempts').insert({
      email: userEmail,
      ip_address: ipAddress,
      user_agent: userAgent,
      success: true,
      tenant_id: tenantId,
    });

    // Log to audit
    await supabase.from('password_reset_audit_log').insert(auditLog);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Contraseña temporal generada y enviada por email'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reset-user-password:', error);
    
    // Record failed attempt
    auditLog.success = false;
    auditLog.error_message = error.message;

    // Try to log the failed attempt (don't throw if this fails)
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase.from('password_reset_attempts').insert({
        email: auditLog.email || 'unknown',
        ip_address: auditLog.ip_address,
        user_agent: auditLog.user_agent,
        success: false,
        error_message: error.message,
        tenant_id: auditLog.tenant_id,
      });

      await supabase.from('password_reset_audit_log').insert(auditLog);
    } catch (logError) {
      console.error('Error logging failed attempt:', logError);
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
