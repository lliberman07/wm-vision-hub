import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  target_email: string;
  target_tenant_id: string;
  event_type: string;
  existing_tenants?: any[];
  contract_id?: string;
  owner_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { target_email, target_tenant_id, event_type, existing_tenants, contract_id, owner_id }: NotificationRequest =
      await req.json();

    // Obtener información del tenant destino
    const { data: tenant, error: tenantError } = await supabase
      .from("pms_tenants")
      .select("name, slug")
      .eq("id", target_tenant_id)
      .single();

    if (tenantError) {
      throw new Error(`Error fetching tenant: ${tenantError.message}`);
    }

    // Buscar admins del tenant (CLIENT_ADMIN)
    const { data: admins, error: adminsError } = await supabase
      .from("pms_client_users")
      .select("email, first_name, last_name")
      .eq("tenant_id", target_tenant_id)
      .eq("user_type", "CLIENT_ADMIN")
      .eq("is_active", true);

    if (adminsError) {
      console.error("Error fetching admins:", adminsError);
    }

    // Buscar Granada superadmins
    const { data: superadmins, error: superadminsError } = await supabase
      .from("granada_platform_users")
      .select("email, first_name, last_name")
      .eq("role", "GRANADA_SUPERADMIN")
      .eq("is_active", true);

    if (superadminsError) {
      console.error("Error fetching superadmins:", superadminsError);
    }

    // Preparar contenido del email
    const isCrossTenant = existing_tenants && existing_tenants.length > 0;
    const subject = isCrossTenant
      ? `🔗 Usuario Multi-Tenant Vinculado - ${tenant.name}`
      : `✅ Nuevo Usuario Vinculado - ${tenant.name}`;

    let otherTenantsHtml = "";
    if (isCrossTenant) {
      otherTenantsHtml = `
        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #92400E;">⚠️ Usuario Multi-Tenant</h3>
          <p style="margin: 0 0 8px 0; color: #78350F;">Este usuario ya tiene acceso a:</p>
          <ul style="margin: 0; padding-left: 20px; color: #78350F;">
            ${existing_tenants
              .map(
                (t) =>
                  `<li><strong>${t.tenant_name}</strong> como ${t.user_type}</li>`
              )
              .join("")}
          </ul>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563EB;">${subject}</h2>
            
            <p>Se ha vinculado un usuario a tu tenant:</p>
            
            <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${target_email}</p>
              <p style="margin: 0 0 8px 0;"><strong>Tenant:</strong> ${tenant.name}</p>
              <p style="margin: 0;"><strong>Tipo de Evento:</strong> ${event_type}</p>
            </div>

            ${otherTenantsHtml}

            ${
              contract_id
                ? `<p style="margin: 16px 0;"><strong>Contrato ID:</strong> ${contract_id}</p>`
                : ""
            }
            ${
              owner_id
                ? `<p style="margin: 16px 0;"><strong>Propietario ID:</strong> ${owner_id}</p>`
                : ""
            }

            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
              <p style="font-size: 12px; color: #6B7280; margin: 0;">
                Esta es una notificación automática del sistema de auditoría de Granada PMS.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar emails a admins del tenant
    const adminEmails: string[] = [];
    if (admins && admins.length > 0) {
      for (const admin of admins) {
        try {
          const { error: emailError } = await supabase.functions.invoke("send-email", {
            body: {
              to: admin.email,
              subject,
              html: htmlContent,
            },
          });

          if (emailError) {
            console.error(`Error sending email to admin ${admin.email}:`, emailError);
          } else {
            adminEmails.push(admin.email);
          }
        } catch (error) {
          console.error(`Failed to send email to admin ${admin.email}:`, error);
        }
      }
    }

    // Enviar emails a Granada superadmins si es cross-tenant
    const superadminEmails: string[] = [];
    if (isCrossTenant && superadmins && superadmins.length > 0) {
      for (const superadmin of superadmins) {
        try {
          const { error: emailError } = await supabase.functions.invoke("send-email", {
            body: {
              to: superadmin.email,
              subject: `🔗 [Granada] ${subject}`,
              html: htmlContent,
            },
          });

          if (emailError) {
            console.error(`Error sending email to superadmin ${superadmin.email}:`, emailError);
          } else {
            superadminEmails.push(superadmin.email);
          }
        } catch (error) {
          console.error(`Failed to send email to superadmin ${superadmin.email}:`, error);
        }
      }
    }

    // Registrar notificación en auditoría
    await supabase.rpc("log_user_linking_event", {
      p_event_type: "notification_sent",
      p_event_status: "success",
      p_target_email: target_email,
      p_target_tenant_id: target_tenant_id,
      p_is_cross_tenant_link: isCrossTenant,
      p_existing_tenants: existing_tenants || [],
      p_contract_id: contract_id || null,
      p_owner_id: owner_id || null,
      p_request_source: "notification",
      p_metadata: {
        admins_notified: adminEmails,
        superadmins_notified: superadminEmails,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        admins_notified: adminEmails.length,
        superadmins_notified: superadminEmails.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-user-linked-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
