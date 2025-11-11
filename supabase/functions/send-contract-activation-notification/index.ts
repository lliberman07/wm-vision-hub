import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractActivationRequest {
  contract_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contract_id }: ContractActivationRequest = await req.json();
    console.log("Processing contract activation notification for:", contract_id);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Obtener datos del contrato con joins
    const { data: contractData, error: contractError } = await supabaseAdmin
      .from("pms_contracts")
      .select(`
        *,
        property:pms_properties(id, address, code),
        tenant_renter:pms_tenants_renters(id, full_name, email, user_id),
        tenant:pms_tenants(id, name, slug)
      `)
      .eq("id", contract_id)
      .single();

    if (contractError || !contractData) {
      throw new Error(`Contract not found: ${contractError?.message}`);
    }

    // 2. Obtener propietarios activos de la propiedad
    const { data: owners, error: ownersError } = await supabaseAdmin
      .from("pms_owner_properties")
      .select("*, owner:pms_owners(id, full_name, email, user_id)")
      .eq("property_id", contractData.property_id)
      .or("end_date.is.null,end_date.gte." + new Date().toISOString())
      .gt("share_percent", 0);

    if (ownersError) {
      console.error("Error fetching owners:", ownersError);
    }

    // 3. Obtener usuario del tenant (inmobiliaria/administrador)
    const { data: tenantUsers, error: tenantUsersError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, users!inner(email, raw_user_meta_data)")
      .eq("tenant_id", contractData.tenant_id)
      .eq("module", "PMS")
      .eq("status", "approved")
      .in("role", ["INMOBILIARIA", "ADMINISTRADOR"])
      .limit(1);

    // 4. Obtener superadmin
    const { data: superadmins, error: superadminError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, users!inner(email)")
      .eq("module", "WM")
      .eq("role", "superadmin")
      .eq("status", "approved")
      .limit(1);

    const errors: any[] = [];
    let ownersNotified = 0;
    let ownersCreated = 0;
    let tenantNotified = false;
    let tenantCreated = false;
    let adminNotified = false;
    let superadminNotified = false;
    const ownerEmails: string[] = [];

    // 5. Procesar cada propietario
    if (owners && owners.length > 0) {
      for (const ownerProperty of owners) {
        const owner = ownerProperty.owner;
        if (!owner) continue;

        try {
          let tempPassword = null;
          let isNewUser = false;

          // Si no tiene user_id, intentar crear usuario o buscar existente
          if (!owner.user_id) {
            console.log(`Checking user for owner: ${owner.email}`);
            
            // Primero buscar si ya existe usuario en auth.users con este email
            const { data: { users: existingAuthUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = existingAuthUsers?.find(u => u.email === owner.email);
            
            let userId = existingUser ? existingUser.id : null;

            if (!userId) {
              // No existe, crear usuario
              console.log(`Creating new user for owner: ${owner.email}`);
              
              const nameParts = owner.full_name?.split(" ") || ["Usuario", "PMS"];
              const firstName = nameParts[0] || "Usuario";
              const lastName = nameParts.slice(1).join(" ") || "PMS";

              const { data: createUserData, error: createUserError } = await supabaseAdmin.functions.invoke(
                "create-pms-user",
                {
                  body: {
                    email: owner.email,
                    first_name: firstName,
                    last_name: lastName,
                  },
                }
              );

              if (createUserError) {
                console.error(`Error creating user for owner ${owner.email}:`, createUserError);
                errors.push({ owner: owner.email, error: createUserError.message });
                continue;
              }

              userId = createUserData.user_id;
              tempPassword = createUserData.temp_password;
              isNewUser = true;
              ownersCreated++;
            } else {
              console.log(`User already exists for owner: ${owner.email}, skipping user creation`);
              isNewUser = false;
            }

            // Verificar si ya tiene rol de propietario
            const { data: existingRole } = await supabaseAdmin
              .from("user_roles")
              .select("id")
              .eq("user_id", userId)
              .eq("role", "PROPIETARIO")
              .eq("module", "PMS")
              .eq("tenant_id", contractData.tenant_id)
              .limit(1);

            if (!existingRole || existingRole.length === 0) {
              // Asignar rol PROPIETARIO
              const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
                user_id: userId,
                role: "PROPIETARIO",
                module: "PMS",
                tenant_id: contractData.tenant_id,
                status: "approved",
              });

              if (roleError) {
                console.error(`Error assigning role to owner ${owner.email}:`, roleError);
                errors.push({ owner: owner.email, error: roleError.message });
              }
            }

            // Actualizar pms_owners.user_id si aún no está asignado
            if (userId) {
              const { error: updateOwnerError } = await supabaseAdmin
                .from("pms_owners")
                .update({ user_id: userId })
                .eq("id", owner.id);

              if (updateOwnerError) {
                console.error(`Error updating owner user_id:`, updateOwnerError);
                errors.push({ owner: owner.email, error: updateOwnerError.message });
              }
            }
          }

          // Enviar email (con o sin credenciales)
          const emailSubject = isNewUser
            ? `✅ Contrato ${contractData.contract_number} Activado - Acceso al PMS`
            : `✅ Nuevo Contrato Activado: ${contractData.contract_number}`;

          const emailHtml = isNewUser
            ? `
              <h2>Hola ${owner.full_name},</h2>
              <p>¡Bienvenido al Sistema PMS de WM Real Estate!</p>
              <p>Te informamos que el contrato de alquiler de tu propiedad ubicada en <strong>${contractData.property.address}</strong> ha sido activado exitosamente.</p>
              
              <h3>📋 DETALLES DEL CONTRATO:</h3>
              <ul>
                <li><strong>Número:</strong> ${contractData.contract_number}</li>
                <li><strong>Dirección:</strong> ${contractData.property.address}</li>
                <li><strong>Inquilino:</strong> ${contractData.tenant_renter.full_name}</li>
                <li><strong>Período:</strong> ${new Date(contractData.start_date).toLocaleDateString()} - ${new Date(contractData.end_date).toLocaleDateString()}</li>
                <li><strong>Monto mensual:</strong> $${contractData.monthly_rent} ${contractData.currency}</li>
                <li><strong>Tu participación:</strong> ${ownerProperty.share_percent}%</li>
              </ul>

              <h3>🔐 TUS CREDENCIALES DE ACCESO:</h3>
              <ul>
                <li><strong>Email:</strong> ${owner.email}</li>
                <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
                <li><strong>Link de acceso:</strong> <a href="https://wm-real-estate.lovable.app/pms/login">https://wm-real-estate.lovable.app/pms/login</a></li>
              </ul>

              <h3>📊 TU ROL: PROPIETARIO</h3>
              <p>Con tu cuenta podrás:</p>
              <ul>
                <li>✓ Ver el estado de tu contrato en tiempo real</li>
                <li>✓ Consultar los pagos recibidos del inquilino</li>
                <li>✓ Acceder a reportes mensuales automáticos</li>
                <li>✓ Descargar comprobantes y documentación</li>
                <li>✓ Revisar el historial de mantenimiento</li>
                <li>✓ Consultar las liquidaciones de alquiler</li>
              </ul>

              <h3>🔒 PRIMERA CONEXIÓN:</h3>
              <ol>
                <li>Haz clic en el link de acceso arriba</li>
                <li>Ingresa tu email y contraseña temporal</li>
                <li>El sistema te pedirá cambiar tu contraseña</li>
                <li>¡Listo! Ya puedes explorar tu panel de propietario</li>
              </ol>

              <p><strong>⚠️ IMPORTANTE:</strong> Por tu seguridad, debes cambiar esta contraseña temporal en tu primer inicio de sesión.</p>
              
              <p>Saludos cordiales,<br>Equipo WM Real Estate</p>
            `
            : `
              <h2>Hola ${owner.full_name},</h2>
              <p>Te informamos que se ha activado un nuevo contrato para tu propiedad en <strong>${contractData.property.address}</strong>.</p>
              
              <h3>📋 DETALLES DEL CONTRATO:</h3>
              <ul>
                <li><strong>Número:</strong> ${contractData.contract_number}</li>
                <li><strong>Dirección:</strong> ${contractData.property.address}</li>
                <li><strong>Inquilino:</strong> ${contractData.tenant_renter.full_name}</li>
                <li><strong>Período:</strong> ${new Date(contractData.start_date).toLocaleDateString()} - ${new Date(contractData.end_date).toLocaleDateString()}</li>
                <li><strong>Monto mensual:</strong> $${contractData.monthly_rent} ${contractData.currency}</li>
                <li><strong>Tu participación:</strong> ${ownerProperty.share_percent}%</li>
              </ul>

              <h3>🔐 ACCESO AL SISTEMA:</h3>
              <p>Ingresa con tus credenciales habituales en:<br>
              <a href="https://wm-real-estate.lovable.app/pms/login">https://wm-real-estate.lovable.app/pms/login</a></p>

              <p>📊 Desde tu panel podrás consultar toda la información del contrato y los pagos asociados.</p>
              
              <p>Saludos,<br>Equipo WM Real Estate</p>
            `;

          // TODO: Reemplazar onboarding@resend.dev con tu dominio verificado
          // Ejemplo: "WM Real Estate <noreply@tudominio.com>"
          await resend.emails.send({
            from: "WM Real Estate <onboarding@resend.dev>",
            to: [owner.email],
            subject: emailSubject,
            html: emailHtml,
          });
          
          console.log(`✅ Resend API called for owner: ${owner.email}`);

          ownersNotified++;
          ownerEmails.push(owner.email);
          console.log(`Email sent to owner: ${owner.email}`);
        } catch (error: any) {
          console.error(`Error processing owner ${owner.email}:`, error);
          errors.push({ owner: owner.email, error: error.message });
        }
      }
    }

    // 6. Procesar inquilino
    if (contractData.tenant_renter) {
      try {
        const tenant = contractData.tenant_renter;
        let tempPassword = null;
        let isNewUser = false;

        if (!tenant.user_id) {
          console.log(`Checking user for tenant: ${tenant.email}`);
          
          // Buscar si ya existe usuario en auth.users con este email
          const { data: { users: existingAuthUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = existingAuthUsers?.find(u => u.email === tenant.email);
          
          let userId = existingUser ? existingUser.id : null;

          if (!userId) {
            // No existe, crear usuario
            console.log(`Creating new user for tenant: ${tenant.email}`);
            
            const nameParts = tenant.full_name?.split(" ") || ["Inquilino", "PMS"];
            const firstName = nameParts[0] || "Inquilino";
            const lastName = nameParts.slice(1).join(" ") || "PMS";

            const { data: createUserData, error: createUserError } = await supabaseAdmin.functions.invoke(
              "create-pms-user",
              {
                body: {
                  email: tenant.email,
                  first_name: firstName,
                  last_name: lastName,
                },
              }
            );

            if (createUserError) {
              console.error(`Error creating user for tenant:`, createUserError);
              errors.push({ tenant: tenant.email, error: createUserError.message });
            } else {
              userId = createUserData.user_id;
              tempPassword = createUserData.temp_password;
              isNewUser = true;
              tenantCreated = true;
            }
          } else {
            console.log(`User already exists for tenant: ${tenant.email}, skipping user creation`);
            isNewUser = false;
          }

          if (userId) {
            // Verificar si ya tiene rol de inquilino
            const { data: existingRole } = await supabaseAdmin
              .from("user_roles")
              .select("id")
              .eq("user_id", userId)
              .eq("role", "INQUILINO")
              .eq("module", "PMS")
              .eq("tenant_id", contractData.tenant_id)
              .limit(1);

            if (!existingRole || existingRole.length === 0) {
              // Asignar rol INQUILINO
              await supabaseAdmin.from("user_roles").insert({
                user_id: userId,
                role: "INQUILINO",
                module: "PMS",
                tenant_id: contractData.tenant_id,
                status: "approved",
              });
            }

            // Actualizar pms_tenants_renters.user_id
            await supabaseAdmin
              .from("pms_tenants_renters")
              .update({ user_id: userId })
              .eq("id", tenant.id);
          }
        }

        // Enviar email al inquilino
        const emailSubject = isNewUser
          ? `✅ Contrato ${contractData.contract_number} Activado - Acceso al PMS`
          : `✅ Nuevo Contrato Activado: ${contractData.contract_number}`;

        const emailHtml = isNewUser
          ? `
            <h2>Hola ${tenant.full_name},</h2>
            <p>¡Bienvenido al Sistema PMS de WM Real Estate!</p>
            <p>Tu contrato de alquiler en <strong>${contractData.property.address}</strong> ha sido activado exitosamente.</p>
            
            <h3>📋 DETALLES DEL CONTRATO:</h3>
            <ul>
              <li><strong>Número:</strong> ${contractData.contract_number}</li>
              <li><strong>Dirección:</strong> ${contractData.property.address}</li>
              <li><strong>Período:</strong> ${new Date(contractData.start_date).toLocaleDateString()} - ${new Date(contractData.end_date).toLocaleDateString()}</li>
              <li><strong>Monto mensual:</strong> $${contractData.monthly_rent} ${contractData.currency}</li>
            </ul>

            <h3>🔐 TUS CREDENCIALES DE ACCESO:</h3>
            <ul>
              <li><strong>Email:</strong> ${tenant.email}</li>
              <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
              <li><strong>Link de acceso:</strong> <a href="https://wm-real-estate.lovable.app/pms/login">https://wm-real-estate.lovable.app/pms/login</a></li>
            </ul>

            <h3>📅 TU ROL: INQUILINO</h3>
            <p>Con tu cuenta podrás:</p>
            <ul>
              <li>✓ Ver tu calendario de pagos mes a mes</li>
              <li>✓ Cargar comprobantes de pago</li>
              <li>✓ Consultar el estado de tus pagos</li>
              <li>✓ Acceder a la documentación del contrato</li>
              <li>✓ Reportar mantenimientos o incidencias</li>
              <li>✓ Revisar tu historial de pagos</li>
            </ul>

            <h3>🔒 PRIMERA CONEXIÓN:</h3>
            <ol>
              <li>Haz clic en el link de acceso arriba</li>
              <li>Ingresa tu email y contraseña temporal</li>
              <li>El sistema te pedirá cambiar tu contraseña</li>
              <li>¡Listo! Ya puedes ver tu contrato y calendario</li>
            </ol>

            <p><strong>⚠️ IMPORTANTE:</strong> Cambia tu contraseña temporal en el primer acceso.</p>
            
            <p>Saludos cordiales,<br>Equipo WM Real Estate</p>
          `
          : `
            <h2>Hola ${tenant.full_name},</h2>
            <p>Tu nuevo contrato de alquiler en <strong>${contractData.property.address}</strong> ha sido activado.</p>
            
            <h3>📋 DETALLES DEL CONTRATO:</h3>
            <ul>
              <li><strong>Número:</strong> ${contractData.contract_number}</li>
              <li><strong>Dirección:</strong> ${contractData.property.address}</li>
              <li><strong>Período:</strong> ${new Date(contractData.start_date).toLocaleDateString()} - ${new Date(contractData.end_date).toLocaleDateString()}</li>
              <li><strong>Monto mensual:</strong> $${contractData.monthly_rent} ${contractData.currency}</li>
            </ul>

            <h3>🔐 ACCESO AL SISTEMA:</h3>
            <p>Ingresa con tus credenciales habituales en:<br>
            <a href="https://wm-real-estate.lovable.app/pms/login">https://wm-real-estate.lovable.app/pms/login</a></p>

            <p>📅 Tu calendario de pagos ya está disponible en tu panel.</p>
            
            <p>Saludos,<br>Equipo WM Real Estate</p>
          `;

        await resend.emails.send({
          from: "WM Real Estate <onboarding@resend.dev>",
          to: [tenant.email],
          subject: emailSubject,
          html: emailHtml,
        });
        
        console.log(`✅ Resend API called for tenant: ${tenant.email}`);

        tenantNotified = true;
        console.log(`Email sent to tenant: ${tenant.email}`);
      } catch (error: any) {
        console.error(`Error processing tenant:`, error);
        errors.push({ tenant: contractData.tenant_renter.email, error: error.message });
      }
    }

    // 7. Enviar email al tenant (inmobiliaria/administrador)
    if (tenantUsers && tenantUsers.length > 0) {
      try {
        const tenantUser = tenantUsers[0];
        const ownersList = owners?.map(op => op.owner?.full_name).filter(Boolean).join(", ") || "N/A";

        await resend.emails.send({
          from: "WM Real Estate <onboarding@resend.dev>",
          to: [tenantUser.users.email],
          subject: `📊 Registro: Contrato ${contractData.contract_number} Activado`,
          html: `
            <h2>Estimado equipo de ${contractData.tenant.name},</h2>
            <p>Se ha activado exitosamente el siguiente contrato en el sistema PMS:</p>
            
            <h3>📋 RESUMEN DEL CONTRATO:</h3>
            <ul>
              <li><strong>Número:</strong> ${contractData.contract_number}</li>
              <li><strong>Propiedad:</strong> ${contractData.property.address}</li>
              <li><strong>Inquilino:</strong> ${contractData.tenant_renter.full_name}</li>
              <li><strong>Propietario(s):</strong> ${ownersList}</li>
              <li><strong>Período:</strong> ${new Date(contractData.start_date).toLocaleDateString()} - ${new Date(contractData.end_date).toLocaleDateString()}</li>
              <li><strong>Monto mensual:</strong> $${contractData.monthly_rent} ${contractData.currency}</li>
            </ul>

            <h3>✅ ACCIONES REALIZADAS:</h3>
            <ul>
              <li>Contrato activado en el sistema</li>
              <li>Proyecciones mensuales generadas</li>
              <li>Calendario de pagos creado</li>
              <li>Notificaciones enviadas a propietario(s) e inquilino</li>
              <li>Estado de propiedad actualizado a "Alquilada"</li>
            </ul>

            <p>📊 Puedes gestionar este contrato desde tu panel administrativo.</p>
            
            <p>Sistema PMS - WM Real Estate</p>
          `,
        });

        adminNotified = true;
        console.log(`✅ Resend API called for tenant admin: ${tenantUser.users.email}`);
      } catch (error: any) {
        console.error(`Error sending email to tenant admin:`, error);
        errors.push({ admin: "tenant", error: error.message });
      }
    }

    // 8. Enviar email al superadmin
    if (superadmins && superadmins.length > 0) {
      try {
        const superadmin = superadmins[0];
        const ownersList = owners?.map(op => op.owner?.full_name).filter(Boolean).join(", ") || "N/A";
        
        let usersCreatedInfo = "";
        if (ownersCreated > 0 || tenantCreated) {
          usersCreatedInfo = `
            <h3>👥 USUARIOS CREADOS AUTOMÁTICAMENTE:</h3>
            <ul>
              ${ownersCreated > 0 ? `<li>Propietarios: ${ownersCreated} usuario(s) creados</li>` : ""}
              ${tenantCreated ? `<li>Inquilino: ${contractData.tenant_renter.email} - Rol: Inquilino</li>` : ""}
            </ul>
          `;
        }

        await resend.emails.send({
          from: "WM Real Estate <onboarding@resend.dev>",
          to: [superadmin.users.email],
          subject: `🔔 Sistema: Contrato ${contractData.contract_number} Activado`,
          html: `
            <h2>Notificación del Sistema PMS</h2>
            
            <h3>📋 CONTRATO ACTIVADO:</h3>
            <ul>
              <li><strong>Número:</strong> ${contractData.contract_number}</li>
              <li><strong>Tenant:</strong> ${contractData.tenant.name}</li>
              <li><strong>Propiedad:</strong> ${contractData.property.address}</li>
              <li><strong>Inquilino:</strong> ${contractData.tenant_renter.full_name}</li>
              <li><strong>Propietario(s):</strong> ${ownersList}</li>
              <li><strong>Monto:</strong> $${contractData.monthly_rent} ${contractData.currency}</li>
              <li><strong>Período:</strong> ${new Date(contractData.start_date).toLocaleDateString()} - ${new Date(contractData.end_date).toLocaleDateString()}</li>
            </ul>

            ${usersCreatedInfo}

            <h3>📧 NOTIFICACIONES ENVIADAS:</h3>
            <ul>
              <li>✓ Propietario(s): ${ownersNotified} email(s) enviados</li>
              <li>✓ Inquilino: ${tenantNotified ? "Email enviado" : "No enviado"}</li>
              <li>✓ Tenant: ${adminNotified ? "Email de registro enviado" : "No enviado"}</li>
            </ul>

            <p>Sistema PMS - WM Real Estate</p>
          `,
        });

        superadminNotified = true;
        console.log(`✅ Resend API called for superadmin: ${superadmin.users.email}`);
      } catch (error: any) {
        console.error(`Error sending email to superadmin:`, error);
        errors.push({ superadmin: true, error: error.message });
      }
    }

    // 9. Registrar en logs
    await supabaseAdmin.from("pms_contract_activation_logs").insert({
      contract_id,
      tenant_id: contractData.tenant_id,
      owners_notified: ownersNotified,
      owners_created: ownersCreated,
      tenant_notified: tenantNotified,
      tenant_created: tenantCreated,
      admin_notified: adminNotified,
      superadmin_notified: superadminNotified,
      owner_emails: ownerEmails,
      errors: errors.length > 0 ? errors : null,
    });

    console.log("Contract activation notification completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          owners_notified: ownersNotified,
          owners_created: ownersCreated,
          tenant_notified: tenantNotified,
          tenant_created: tenantCreated,
          admin_notified: adminNotified,
          superadmin_notified: superadminNotified,
          errors,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contract-activation-notification:", error);
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
