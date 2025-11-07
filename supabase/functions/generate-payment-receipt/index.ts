import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReceiptRequest {
  payment_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { payment_id }: PaymentReceiptRequest = await req.json();

    if (!payment_id) {
      throw new Error("payment_id is required");
    }

    console.log("Generating receipt for payment:", payment_id);

    // 1. Obtener datos completos del pago
    const { data: paymentData, error: paymentError } = await supabase
      .from("pms_payments")
      .select(`
        *,
        contract:pms_contracts!inner (
          *,
          property:pms_properties!inner (
            *,
            owners:pms_owner_properties!inner (
              *,
              owner:pms_owners!inner (*)
            )
          ),
          tenant_renter:pms_tenants_renters!inner (*)
        ),
        tenant:pms_tenants!inner (*)
      `)
      .eq("id", payment_id)
      .single();

    if (paymentError || !paymentData) {
      throw new Error(`Error fetching payment data: ${paymentError?.message}`);
    }

    // 2. Verificar si ya existe un recibo para este pago
    const { data: existingReceipt } = await supabase
      .from("pms_payment_receipts")
      .select("*")
      .eq("payment_id", payment_id)
      .maybeSingle();

    let receiptId = existingReceipt?.id;
    let receiptNumber = existingReceipt?.receipt_number;

    // 3. Si no existe, crear registro de recibo
    if (!existingReceipt) {
      const { data: newReceipt, error: receiptError } = await supabase
        .rpc("generate_receipt_number", { p_tenant_id: paymentData.tenant_id });

      if (receiptError) {
        throw new Error(`Error generating receipt number: ${receiptError.message}`);
      }

      receiptNumber = newReceipt;

      const { data: insertedReceipt, error: insertError } = await supabase
        .from("pms_payment_receipts")
        .insert({
          tenant_id: paymentData.tenant_id,
          payment_id: payment_id,
          contract_id: paymentData.contract_id,
          receipt_number: receiptNumber,
          receipt_date: new Date().toISOString().split('T')[0],
          status: "pending",
        })
        .select()
        .single();

      if (insertError || !insertedReceipt) {
        throw new Error(`Error creating receipt record: ${insertError?.message}`);
      }

      receiptId = insertedReceipt.id;
    }

    // 4. Generar HTML del recibo
    const receiptHtml = generateReceiptHTML(paymentData, receiptNumber);

    // 5. Convertir HTML a PDF usando jsPDF (simulación - en producción usar puppeteer)
    // Por ahora guardamos el HTML como "PDF" para testing
    const pdfBlob = new Blob([receiptHtml], { type: "application/pdf" });
    const fileName = `${receiptNumber}.pdf`;
    const filePath = `${paymentData.tenant_id}/${fileName}`;

    // 6. Subir PDF a Storage
    const { error: uploadError } = await supabase.storage
      .from("payment-receipts")
      .upload(filePath, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Error uploading PDF: ${uploadError.message}`);
    }

    // 7. Obtener URL pública (signed URL)
    const { data: urlData } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 año

    const pdfUrl = urlData?.signedUrl || filePath;

    // 8. Actualizar registro de recibo con URL y status
    const { error: updateError } = await supabase
      .from("pms_payment_receipts")
      .update({
        pdf_url: filePath,
        pdf_generated_at: new Date().toISOString(),
        status: "generated",
        metadata: {
          generated_by: "system",
          file_size: pdfBlob.size,
          file_name: fileName,
        },
      })
      .eq("id", receiptId);

    if (updateError) {
      throw new Error(`Error updating receipt: ${updateError.message}`);
    }

    console.log("Receipt generated successfully:", receiptNumber);

    // 9. Invocar función de envío de emails
    try {
      await supabase.functions.invoke("send-payment-receipt-emails", {
        body: { receipt_id: receiptId },
      });
      console.log("Email sending triggered for receipt:", receiptId);
    } catch (emailError) {
      console.error("Error triggering email function:", emailError);
      // No fallar el proceso principal si falla el envío de emails
    }

    return new Response(
      JSON.stringify({
        success: true,
        receipt_id: receiptId,
        receipt_number: receiptNumber,
        pdf_url: pdfUrl,
        pdf_path: filePath,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-payment-receipt:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateReceiptHTML(paymentData: any, receiptNumber: string): string {
  const contract = paymentData.contract;
  const property = contract.property;
  const tenant = contract.tenant_renter;
  const owners = property.owners || [];

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo de Pago - ${receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; font-size: 12px; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 40px auto; padding: 40px; border: 2px solid #1a1a1a; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1a1a1a; }
    .header h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 10px; }
    .receipt-number { font-size: 16px; font-weight: bold; color: #666; margin-bottom: 5px; }
    .receipt-date { font-size: 14px; color: #888; }
    .section { margin-bottom: 25px; padding: 20px; background: #f9f9f9; border-left: 4px solid #1a1a1a; }
    .section-title { font-size: 16px; font-weight: bold; color: #1a1a1a; margin-bottom: 15px; text-transform: uppercase; }
    .info-row { display: flex; margin-bottom: 10px; }
    .info-label { font-weight: bold; width: 180px; color: #555; }
    .info-value { flex: 1; color: #333; }
    .amount-box { background: #1a1a1a; color: white; padding: 20px; text-align: center; margin: 20px 0; }
    .amount-box .label { font-size: 14px; margin-bottom: 10px; }
    .amount-box .amount { font-size: 32px; font-weight: bold; }
    .owners-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .owners-table th, .owners-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    .owners-table th { background: #1a1a1a; color: white; font-weight: bold; }
    .owners-table tr:hover { background: #f5f5f5; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #1a1a1a; text-align: center; font-size: 11px; color: #888; }
    .signature { margin-top: 30px; padding: 15px; background: #f0f0f0; text-align: center; font-size: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RECIBO DE PAGO</h1>
      <div class="receipt-number">N° ${receiptNumber}</div>
      <div class="receipt-date">Fecha: ${formatDate(paymentData.paid_date || new Date().toISOString())}</div>
    </div>

    <div class="section">
      <div class="section-title">Datos del Contrato</div>
      <div class="info-row">
        <div class="info-label">Contrato:</div>
        <div class="info-value">${contract.contract_number}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Propiedad:</div>
        <div class="info-value">${property.code || property.id}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Dirección:</div>
        <div class="info-value">${property.address || 'No especificada'}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Inquilino:</div>
        <div class="info-value">${tenant.first_name} ${tenant.last_name}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Detalle del Pago</div>
      <div class="info-row">
        <div class="info-label">Período:</div>
        <div class="info-value">${formatDate(paymentData.due_date)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Fecha de Pago:</div>
        <div class="info-value">${formatDate(paymentData.paid_date || new Date().toISOString())}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Método de Pago:</div>
        <div class="info-value">${paymentData.payment_method || 'No especificado'}</div>
      </div>
      ${paymentData.reference_number ? `
      <div class="info-row">
        <div class="info-label">Referencia:</div>
        <div class="info-value">${paymentData.reference_number}</div>
      </div>
      ` : ''}
    </div>

    <div class="amount-box">
      <div class="label">MONTO TOTAL PAGADO</div>
      <div class="amount">${formatCurrency(paymentData.paid_amount)}</div>
    </div>

    ${owners.length > 0 ? `
    <div class="section">
      <div class="section-title">Distribución a Propietarios</div>
      <table class="owners-table">
        <thead>
          <tr>
            <th>Propietario</th>
            <th>Participación</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          ${owners.map((op: any) => `
            <tr>
              <td>${op.owner.first_name} ${op.owner.last_name}</td>
              <td>${op.share_percent}%</td>
              <td>${formatCurrency(paymentData.paid_amount * (op.share_percent / 100))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="signature">
      <strong>Firma Digital:</strong> ${receiptNumber.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}<br>
      Generado electrónicamente el ${formatDate(new Date().toISOString())} a las ${new Date().toLocaleTimeString('es-AR')}
    </div>

    <div class="footer">
      Este documento es un comprobante electrónico de pago.<br>
      Para cualquier consulta, por favor contacte con la administración.
    </div>
  </div>
</body>
</html>
  `;
}

serve(handler);
