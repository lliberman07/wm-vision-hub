import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateGranadaUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, first_name, last_name, role }: CreateGranadaUserRequest = await req.json();

    console.log("Creating Granada platform user:", { email, first_name, last_name, role });

    // Crear cliente de Supabase con service role key
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

    // Generar contraseña temporal segura
    const tempPassword = crypto.randomUUID().substring(0, 12) + 'Aa1!';

    let userId: string;
    let isNewUser = false;
    
    // Intentar crear el usuario primero
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role,
      }
    });

    if (authError) {
      // Si el error es que el usuario ya existe, obtenerlo
      if (authError.message.includes('already been registered') || authError.message.includes('email_exists')) {
        console.log("User already exists, fetching existing user for email:", email);
        
        // Buscar el usuario por email
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email === email);
        
        if (!existingUser) {
          throw new Error('Usuario ya existe pero no se pudo encontrar');
        }
        
        userId = existingUser.id;
        console.log("Found existing user:", userId);
        
        // Actualizar metadata del usuario existente
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            first_name,
            last_name,
            role,
          }
        });
        
        console.log("Updated existing user metadata");
      } else {
        console.error("Error creating auth user:", authError);
        throw new Error('No se pudo crear la cuenta de usuario: ' + authError.message);
      }
    } else {
      userId = authData.user.id;
      isNewUser = true;
      console.log("Auth user created successfully:", userId);
    }

    // Verificar si ya existe en granada_platform_users
    const { data: existingPlatformUser } = await supabaseAdmin
      .from('granada_platform_users')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingPlatformUser) {
      // Si ya existe, actualizar el registro
      const { error: updateError } = await supabaseAdmin
        .from('granada_platform_users')
        .update({
          first_name: first_name,
          last_name: last_name,
          role: role,
          is_active: true,
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error("Error updating platform user record:", updateError);
        throw new Error('No se pudo actualizar el registro de usuario: ' + updateError.message);
      }

      console.log("Platform user record updated successfully");
    } else {
      // Crear nuevo registro en granada_platform_users
      const { error: platformUserError } = await supabaseAdmin
        .from('granada_platform_users')
        .insert({
          user_id: userId,
          email: email,
          first_name: first_name,
          last_name: last_name,
          role: role,
          is_active: true,
        });

      if (platformUserError) {
        console.error("Error creating platform user record:", platformUserError);
        throw new Error('No se pudo crear el registro de usuario: ' + platformUserError.message);
      }

      console.log("Platform user record created successfully");
    }

    // Enviar email de bienvenida con credenciales solo si es usuario nuevo
    if (isNewUser) {
      const { error: emailError } = await supabaseAdmin.functions.invoke('send-welcome-email', {
        body: {
          email: email,
          first_name: first_name,
          password: tempPassword,
          platform: 'granada'
        },
      });

      if (emailError) {
        console.error("Error sending welcome email:", emailError);
        // No lanzar error aquí, el usuario ya fue creado exitosamente
      } else {
        console.log("Welcome email sent successfully");
      }
    } else {
      // Para usuarios existentes, enviar email de reseteo de contraseña
      console.log("User already existed, sending password reset email");
      const { error: resetError } = await supabaseAdmin.functions.invoke('reset-user-password', {
        body: {
          user_id: userId
        }
      });

      if (resetError) {
        console.error("Error sending password reset:", resetError);
      }
    }

    return new Response(
      JSON.stringify({ 
        user_id: userId,
        temp_password: isNewUser ? tempPassword : null,
        message: isNewUser ? 'Usuario creado exitosamente' : 'Usuario reactivado y contraseña reseteada'
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
    console.error("Error in create-granada-platform-user function:", error);
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
