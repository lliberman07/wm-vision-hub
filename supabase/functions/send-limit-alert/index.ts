import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LimitAlertRequest {
  tenant_id: string;
  resource_type: "property" | "user" | "contract" | "branch";
  current_count: number;
  limit: number;
  threshold: 80 | 100;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenant_id, resource_type, current_count, limit, threshold }: LimitAlertRequest = await req.json();

    // Obtener CLIENT_ADMIN del tenant
    const { data: clientAdmin } = await supabase
      .from("pms_client_users")
      .select("email, first_name, last_name")
      .eq("tenant_id", tenant_id)
      .eq("user_type", "CLIENT_ADMIN")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!clientAdmin) {
      return new Response(JSON.stringify({ error: "No CLIENT_ADMIN found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resourceLabels = {
      property: "propiedades",
      user: "usuarios",
      contract: "contratos",
      branch: "sucursales",
    };

    const subject = threshold === 100
      ? `⚠️ Límite de ${resourceLabels[resource_type]} alcanzado`
      : `📊 Cerca del límite de ${resourceLabels[resource_type]}`;

    const message = threshold === 100
      ? `Has alcanzado el límite de ${resourceLabels[resource_type]} de tu plan (${current_count}/${limit}).`
      : `Estás utilizando ${current_count} de ${limit} ${resourceLabels[resource_type]} disponibles.`;

    await resend.emails.send({
      from: "Granada PMS <notificaciones@granadapms.com>",
      to: [clientAdmin.email],
      subject,
      html: `
        <h2>${subject}</h2>
        <p>Hola ${clientAdmin.first_name},</p>
        <p>${message}</p>
        ${threshold === 100 ? `
          <p>Para continuar agregando ${resourceLabels[resource_type]}, puedes:</p>
          <ul>
            <li>Cambiar algunos recursos a estado "No Activo" (no consumen límite)</li>
            <li>Actualizar tu plan de suscripción</li>
          </ul>
        ` : `
          <p>Te recomendamos planificar con anticipación para evitar interrupciones en tu gestión.</p>
        `}
        <p><a href="https://granadapms.com/client-admin/subscription">Ver mi suscripción</a></p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending limit alert:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
