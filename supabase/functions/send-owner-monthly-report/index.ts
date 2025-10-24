import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  contract_id: string;
  period: string;
  owner_id: string;
  send_email?: boolean;
  manual?: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { contract_id, period, owner_id, send_email = true, manual = false }: ReportRequest = await req.json();

    console.log(`[send-owner-monthly-report] Processing: contract=${contract_id}, period=${period}, owner=${owner_id}, send_email=${send_email}, manual=${manual}`);

    // 1. Obtener datos del contrato
    const { data: contract, error: contractError } = await supabase
      .from("pms_contracts")
      .select(`
        *,
        pms_tenants!inner(id, name, admin_email),
        pms_properties!inner(id, code, address, city, state, country, tenant_id),
        pms_tenants_renters!inner(full_name)
      `)
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      throw new Error(`Contract not found: ${contractError?.message}`);
    }

    // 2. Obtener datos del propietario
    const { data: ownerProperty, error: ownerError } = await supabase
      .from("pms_owner_properties")
      .select(`
        share_percent,
        pms_owners!inner(id, full_name, email, user_id)
      `)
      .eq("property_id", contract.pms_properties.id)
      .eq("owner_id", owner_id)
      .single();

    if (ownerError || !ownerProperty) {
      throw new Error(`Owner not found: ${ownerError?.message}`);
    }

    const owner = ownerProperty.pms_owners;
    const sharePercent = ownerProperty.share_percent;

    if (!owner.email) {
      throw new Error(`Owner ${owner.full_name} has no email configured`);
    }

    // 3. Obtener admin_email del tenant (contrato o propiedad)
    let adminEmail = contract.pms_tenants?.admin_email;
    
    if (!adminEmail) {
      const { data: propertyTenant } = await supabase
        .from("pms_tenants")
        .select("admin_email")
        .eq("id", contract.pms_properties.tenant_id)
        .single();
      
      adminEmail = propertyTenant?.admin_email || "administracion@wmpms.com.ar";
    }

    // 4. Obtener cashflow del período
    const { data: cashflow } = await supabase
      .from("pms_cashflow_property")
      .select("*")
      .eq("property_id", contract.pms_properties.id)
      .eq("period", period)
      .single();

    const totalIncome = cashflow?.total_income || 0;
    const totalExpenses = cashflow?.total_expenses || 0;
    const netResult = totalIncome - totalExpenses;

    const ownerIncome = totalIncome * (sharePercent / 100);
    const ownerExpenses = totalExpenses * (sharePercent / 100);
    const ownerNet = netResult * (sharePercent / 100);

    // 5. Generar HTML del email
    const [year, month] = period.split("-");
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const periodText = `${monthNames[parseInt(month) - 1]} ${year}`;

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: contract.currency || 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; }
    .container { background: white; }
    .header { background: #3b82f6; color: white; padding: 30px; text-align: center; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .content { padding: 30px; }
    .summary-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-item { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .summary-item:last-child { border-bottom: none; }
    .summary-label { color: #6b7280; }
    .summary-value { font-weight: bold; color: #111827; }
    .cta-button { background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; display: inline-block; border-radius: 6px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .disclaimer { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; font-size: 14px; }
    .property-info { background: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .property-info strong { color: #1e40af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">WM Property Management</div>
      <h1 style="margin: 10px 0; font-size: 20px;">Informe Mensual de Movimientos</h1>
      <p style="margin: 5px 0; opacity: 0.9;">${periodText}</p>
    </div>
    
    <div class="content">
      <h2 style="color: #111827;">Estimado/a ${owner.full_name},</h2>
      
      <p style="line-height: 1.6; color: #374151;">
        Adjuntamos el detalle de movimientos del mes <strong>${periodText}</strong> correspondiente a su participación en la propiedad:
      </p>
      
      <div class="property-info">
        <strong>${contract.pms_properties.code}</strong> - ${contract.pms_properties.address}, ${contract.pms_properties.city}
      </div>
      
      <div class="summary-box">
        <h3 style="margin-top: 0; color: #111827;">Resumen del Período</h3>
        <div class="summary-item">
          <span class="summary-label">Ingresos Totales:</span>
          <span class="summary-value">${formatCurrency(ownerIncome)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Gastos Totales:</span>
          <span class="summary-value">${formatCurrency(ownerExpenses)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Resultado Neto:</span>
          <span class="summary-value" style="color: ${ownerNet >= 0 ? '#10b981' : '#ef4444'};">
            ${formatCurrency(ownerNet)}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Su participación:</span>
          <span class="summary-value">${sharePercent}%</span>
        </div>
      </div>
      
      <p style="line-height: 1.6; color: #374151;">
        Para más información sobre los detalles de cada movimiento, puede ingresar a nuestro sistema de gestión o consultar con su administrador.
      </p>
      
      <div class="disclaimer">
        <strong>Importante:</strong> Si algunos datos de su resumen no coinciden con sus registros, por favor comuníquese con nosotros vía email a <a href="mailto:${adminEmail}" style="color: #f59e0b; text-decoration: none;">${adminEmail}</a>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 5px 0;"><strong>WM Property Management System</strong></p>
      <p style="margin: 5px 0;">Este es un email automático. Por favor no responda directamente.</p>
      <p style="margin: 5px 0;">Para consultas: <a href="mailto:${adminEmail}" style="color: #3b82f6; text-decoration: none;">${adminEmail}</a></p>
    </div>
  </div>
</body>
</html>
    `;

    // 6. Enviar email si está habilitado
    let emailStatus = "sent";
    let errorMessage = null;

    if (send_email) {
      try {
        await resend.emails.send({
          from: "WM Property Management <onboarding@resend.dev>",
          to: [owner.email],
          subject: `Informe Mensual - ${periodText} - ${contract.pms_properties.code}`,
          html: emailHtml,
        });
        console.log(`[send-owner-monthly-report] Email sent to ${owner.email}`);
      } catch (emailError: any) {
        console.error(`[send-owner-monthly-report] Email error:`, emailError);
        emailStatus = "failed";
        errorMessage = emailError.message;
      }
    }

    // 7. Guardar log en la base de datos
    const { error: logError } = await supabase
      .from("pms_owner_report_logs")
      .insert({
        tenant_id: contract.tenant_id,
        contract_id: contract.id,
        property_id: contract.pms_properties.id,
        owner_id: owner.id,
        period,
        email_sent_to: owner.email,
        status: emailStatus,
        error_message: errorMessage,
        pdf_generated: false,
        sent_by: manual ? req.headers.get("x-user-id") : null,
      });

    if (logError) {
      console.error(`[send-owner-monthly-report] Log error:`, logError);
    }

    return new Response(
      JSON.stringify({
        success: emailStatus === "sent",
        message: emailStatus === "sent" 
          ? `Report sent to ${owner.email}` 
          : `Failed to send to ${owner.email}: ${errorMessage}`,
        data: {
          owner: owner.full_name,
          email: owner.email,
          period: periodText,
          summary: {
            income: ownerIncome,
            expenses: ownerExpenses,
            net: ownerNet,
            sharePercent,
          },
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("[send-owner-monthly-report] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
