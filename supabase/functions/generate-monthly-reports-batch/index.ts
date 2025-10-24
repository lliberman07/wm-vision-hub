import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("[generate-monthly-reports-batch] Starting batch process");

    // 1. Calcular período anterior (mes pasado)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const period = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

    console.log(`[generate-monthly-reports-batch] Processing period: ${period}`);

    // 2. Obtener contratos activos durante ese período
    const periodStart = `${period}-01`;
    const periodEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    const periodEndStr = `${periodEnd.getFullYear()}-${String(periodEnd.getMonth() + 1).padStart(2, "0")}-${String(periodEnd.getDate()).padStart(2, "0")}`;

    const { data: contracts, error: contractsError } = await supabase
      .from("pms_contracts")
      .select("id, property_id, contract_number, tenant_id")
      .eq("status", "active")
      .lte("start_date", periodEndStr)
      .gte("end_date", periodStart);

    if (contractsError) {
      throw new Error(`Error fetching contracts: ${contractsError.message}`);
    }

    console.log(`[generate-monthly-reports-batch] Found ${contracts?.length || 0} active contracts`);

    let totalOwners = 0;
    let sentCount = 0;
    let failedCount = 0;
    const failedEmails: string[] = [];

    // 3. Para cada contrato, obtener propietarios y enviar reportes
    for (const contract of contracts || []) {
      console.log(`[generate-monthly-reports-batch] Processing contract: ${contract.contract_number}`);

      // Obtener propietarios activos
      const { data: owners, error: ownersError } = await supabase
        .from("pms_owner_properties")
        .select(`
          owner_id,
          share_percent,
          pms_owners!inner(id, full_name, email)
        `)
        .eq("property_id", contract.property_id)
        .or(`end_date.is.null,end_date.gte.${periodStart}`)
        .gt("share_percent", 0);

      if (ownersError) {
        console.error(`[generate-monthly-reports-batch] Error fetching owners for contract ${contract.id}:`, ownersError);
        continue;
      }

      console.log(`[generate-monthly-reports-batch] Found ${owners?.length || 0} owners for contract ${contract.contract_number}`);

      // Enviar reporte a cada propietario
      for (const ownerData of owners || []) {
        const owner = ownerData.pms_owners;
        
        if (!owner.email) {
          console.log(`[generate-monthly-reports-batch] Skipping owner ${owner.full_name} - no email`);
          continue;
        }

        totalOwners++;

        try {
          // Invocar la función de envío de reporte
          const response = await supabase.functions.invoke("send-owner-monthly-report", {
            body: {
              contract_id: contract.id,
              period,
              owner_id: owner.id,
              send_email: true,
              manual: false,
            },
          });

          if (response.error) {
            throw new Error(response.error.message);
          }

          if (response.data?.success) {
            sentCount++;
            console.log(`[generate-monthly-reports-batch] ✓ Sent to ${owner.email}`);
          } else {
            failedCount++;
            failedEmails.push(owner.email);
            console.error(`[generate-monthly-reports-batch] ✗ Failed to send to ${owner.email}`);
          }
        } catch (error: any) {
          failedCount++;
          failedEmails.push(owner.email);
          console.error(`[generate-monthly-reports-batch] Error sending to ${owner.email}:`, error.message);
        }
      }
    }

    // 4. Resumen de ejecución
    const summary = {
      period,
      totalContracts: contracts?.length || 0,
      totalOwners,
      sentCount,
      failedCount,
      failedEmails,
      timestamp: new Date().toISOString(),
    };

    console.log("[generate-monthly-reports-batch] Batch process completed:", summary);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("[generate-monthly-reports-batch] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
