import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentNotificationRequest {
  submissionId: string;
  contractId: string;
  tenantId: string;
  scheduleItemId: string;
  paidAmount: number;
  paymentCurrency: string;
  paidDate: string;
  paymentMethod: string;
  submittedByName: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, message: "Email notifications not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PaymentNotificationRequest = await req.json();
    console.log("Processing payment notification:", payload);

    // Get contract details with property and tenant info
    const { data: contract, error: contractError } = await supabase
      .from("pms_contracts")
      .select(`
        id,
        contract_number,
        property_id,
        tenant_id,
        pms_properties!inner(
          id,
          code,
          address
        ),
        pms_tenants_renters!inner(
          id,
          full_name,
          email
        )
      `)
      .eq("id", payload.contractId)
      .single();

    if (contractError || !contract) {
      console.error("Error fetching contract:", contractError);
      throw new Error("Contract not found");
    }

    console.log("Contract found:", contract.contract_number);

    // Get property owners' emails
    const { data: ownerLinks, error: ownerLinksError } = await supabase
      .from("pms_property_owners")
      .select(`
        owner_id,
        pms_owners!inner(
          id,
          full_name,
          email
        )
      `)
      .eq("property_id", contract.property_id);

    if (ownerLinksError) {
      console.error("Error fetching owners:", ownerLinksError);
    }

    const ownerEmails: { email: string; name: string }[] = [];
    ownerLinks?.forEach((link: any) => {
      if (link.pms_owners?.email) {
        ownerEmails.push({
          email: link.pms_owners.email,
          name: link.pms_owners.full_name || "Propietario"
        });
      }
    });

    console.log("Owner emails found:", ownerEmails.length);

    // Get CLIENT_ADMIN users for this tenant
    const { data: clientAdmins, error: adminError } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        profiles!inner(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("tenant_id", payload.tenantId)
      .eq("module", "PMS")
      .in("role", ["CLIENT_ADMIN", "INMOBILIARIA", "ADMINISTRADOR"])
      .eq("status", "approved");

    if (adminError) {
      console.error("Error fetching client admins:", adminError);
    }

    const adminEmails: { email: string; name: string }[] = [];
    clientAdmins?.forEach((admin: any) => {
      if (admin.profiles?.email) {
        adminEmails.push({
          email: admin.profiles.email,
          name: `${admin.profiles.first_name || ""} ${admin.profiles.last_name || ""}`.trim() || "Administrador"
        });
      }
    });

    console.log("Admin emails found:", adminEmails.length);

    // Format payment method for display
    const paymentMethodLabels: Record<string, string> = {
      cash: "Efectivo",
      transfer: "Transferencia",
      check: "Cheque",
      card: "Tarjeta",
      other: "Otro"
    };

    const paymentMethodDisplay = paymentMethodLabels[payload.paymentMethod] || payload.paymentMethod;

    // Prepare email content
    const propertyInfo = (contract as any).pms_properties;
    const tenantRenterInfo = (contract as any).pms_tenants_renters;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Nuevo Pago Informado por Inquilino</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #16213e; margin-top: 0;">Detalles del Pago</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Inquilino:</strong></td>
              <td style="padding: 8px 0;">${payload.submittedByName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Contrato:</strong></td>
              <td style="padding: 8px 0;">${contract.contract_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Propiedad:</strong></td>
              <td style="padding: 8px 0;">${propertyInfo?.code || ""} - ${propertyInfo?.address || ""}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Monto:</strong></td>
              <td style="padding: 8px 0; font-size: 18px; color: #16213e;"><strong>${payload.paymentCurrency} ${payload.paidAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Fecha de Pago:</strong></td>
              <td style="padding: 8px 0;">${new Date(payload.paidDate).toLocaleDateString("es-AR")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Método:</strong></td>
              <td style="padding: 8px 0;">${paymentMethodDisplay}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Acción Requerida:</strong> Este pago está pendiente de verificación. 
            Por favor, ingrese al sistema para revisar y aprobar o rechazar este pago.
          </p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Este es un mensaje automático del Sistema de Gestión de Propiedades Granada.
        </p>
      </div>
    `;

    // Combine all recipients
    const allRecipients = [...new Set([...adminEmails.map(a => a.email), ...ownerEmails.map(o => o.email)])];

    console.log("Sending to recipients:", allRecipients);

    if (allRecipients.length === 0) {
      console.log("No recipients found for notification");
      return new Response(
        JSON.stringify({ success: true, message: "No recipients to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email
    const emailResult = await resend.emails.send({
      from: "Granada PMS <notificaciones@granadaplatform.com>",
      to: allRecipients,
      subject: `Nuevo Pago Informado - Contrato ${contract.contract_number}`,
      html: emailHtml
    });

    console.log("Email sent:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification sent to ${allRecipients.length} recipients`,
        recipients: allRecipients
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-payment-submission-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
