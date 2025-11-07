import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendReceiptEmailsRequest {
  receipt_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    const { receipt_id }: SendReceiptEmailsRequest = await req.json();

    if (!receipt_id) {
      throw new Error("receipt_id is required");
    }

    console.log("Sending receipt emails for receipt:", receipt_id);

    // 1. Obtener datos del recibo
    const { data: receiptData, error: receiptError } = await supabase
      .from("pms_payment_receipts")
      .select(`
        *,
        payment:pms_payments!inner (
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
          )
        ),
        tenant:pms_tenants!inner (*)
      `)
      .eq("id", receipt_id)
      .single();

    if (receiptError || !receiptData) {
      throw new Error(`Error fetching receipt data: ${receiptError?.message}`);
    }

    // 2. Verificar configuración de notificaciones del tenant
    const notificationSettings = receiptData.tenant.notification_settings || {
      enable_payment_receipts: true,
      receipt_auto_send: true,
      receipt_recipients: { tenant: true, owners: true, staff: false },
      receipt_cc_emails: [],
    };

    if (!notificationSettings.enable_payment_receipts || !notificationSettings.receipt_auto_send) {
      console.log("Payment receipts disabled or auto-send disabled for tenant:", receiptData.tenant_id);
      return new Response(
        JSON.stringify({ message: "Receipt emails disabled in tenant settings" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 3. Descargar PDF del recibo
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from("payment-receipts")
      .download(receiptData.pdf_url);

    if (downloadError || !pdfData) {
      throw new Error(`Error downloading PDF: ${downloadError?.message}`);
    }

    const pdfBuffer = await pdfData.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // 4. Preparar datos para el email
    const payment = receiptData.payment;
    const contract = payment.contract;
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

    const emailSubject = `Recibo de Pago - ${property.code || 'Propiedad'} - ${formatDate(payment.due_date)}`;

    // 5. Identificar destinatarios
    const recipients: Array<{ email: string; type: string; name: string; percentage?: number }> = [];

    // Inquilino
    if (notificationSettings.receipt_recipients.tenant && tenant.email) {
      recipients.push({
        email: tenant.email,
        type: "tenant",
        name: `${tenant.first_name} ${tenant.last_name}`,
      });
    }

    // Propietarios
    if (notificationSettings.receipt_recipients.owners) {
      for (const ownerProp of owners) {
        if (ownerProp.owner.email && (ownerProp.end_date === null || new Date(ownerProp.end_date) >= new Date())) {
          recipients.push({
            email: ownerProp.owner.email,
            type: "owner",
            name: `${ownerProp.owner.first_name} ${ownerProp.owner.last_name}`,
            percentage: ownerProp.share_percent,
          });
        }
      }
    }

    // 6. Enviar emails
    const emailLogs = [];
    const errors = [];

    for (const recipient of recipients) {
      try {
        const emailHtml = generateEmailHTML(receiptData, recipient, formatCurrency, formatDate);

        const emailResponse = await resend.emails.send({
          from: "WM Property Management <onboarding@resend.dev>",
          to: [recipient.email],
          subject: emailSubject,
          html: emailHtml,
          attachments: [
            {
              filename: `${receiptData.receipt_number}.pdf`,
              content: pdfBase64,
            },
          ],
        });

        console.log(`Email sent to ${recipient.email}:`, emailResponse);

        emailLogs.push({
          tenant_id: receiptData.tenant_id,
          receipt_id: receipt_id,
          recipient_email: recipient.email,
          recipient_type: recipient.type,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      } catch (emailError: any) {
        console.error(`Error sending email to ${recipient.email}:`, emailError);
        
        emailLogs.push({
          tenant_id: receiptData.tenant_id,
          receipt_id: receipt_id,
          recipient_email: recipient.email,
          recipient_type: recipient.type,
          status: "failed",
          error_message: emailError.message,
          sent_at: new Date().toISOString(),
        });

        errors.push({
          email: recipient.email,
          error: emailError.message,
        });
      }
    }

    // 7. Registrar logs de envío
    if (emailLogs.length > 0) {
      const { error: logError } = await supabase
        .from("pms_receipt_email_logs")
        .insert(emailLogs);

      if (logError) {
        console.error("Error inserting email logs:", logError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        receipt_id: receipt_id,
        emails_sent: emailLogs.filter(log => log.status === "sent").length,
        emails_failed: emailLogs.filter(log => log.status === "failed").length,
        recipients: recipients.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-payment-receipt-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateEmailHTML(
  receiptData: any,
  recipient: any,
  formatCurrency: (n: number) => string,
  formatDate: (d: string) => string
): string {
  const payment = receiptData.payment;
  const contract = payment.contract;
  const property = contract.property;
  const tenant = contract.tenant_renter;

  const ownerInfo = recipient.type === "owner" && recipient.percentage
    ? `<p style="background: #f0f0f0; padding: 15px; border-left: 4px solid #1a1a1a; margin: 20px 0;">
         <strong>Su participación:</strong> ${recipient.percentage}%<br>
         <strong>Monto correspondiente:</strong> ${formatCurrency(payment.paid_amount * (recipient.percentage / 100))}
       </p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo de Pago</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1a1a1a; color: white; padding: 30px; text-align: center; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px;">Recibo de Pago</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">${receiptData.receipt_number}</p>
  </div>

  <p style="font-size: 16px;">Estimado/a <strong>${recipient.name}</strong>,</p>

  <p>Se ha registrado exitosamente el pago correspondiente al contrato <strong>${contract.contract_number}</strong>.</p>

  ${ownerInfo}

  <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #1a1a1a; font-size: 18px;">Detalles del Pago</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Propiedad:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${property.address || property.code}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Período:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${formatDate(payment.due_date)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Fecha de Pago:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${formatDate(payment.paid_date || new Date().toISOString())}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Monto:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #ddd; font-weight: bold; color: #1a1a1a; font-size: 18px;">${formatCurrency(payment.paid_amount)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Método:</strong></td>
        <td style="padding: 8px 0;">${payment.payment_method || 'No especificado'}</td>
      </tr>
    </table>
  </div>

  <p style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
    <strong>✓ Pago confirmado</strong><br>
    El comprobante adjunto es válido como recibo de pago oficial.
  </p>

  <p style="color: #666; font-size: 14px; margin-top: 30px;">
    Este es un correo automático. Si tiene alguna consulta, por favor contacte con la administración.
  </p>

  <div style="background: #f5f5f5; padding: 20px; text-align: center; margin-top: 40px; border-top: 2px solid #1a1a1a;">
    <p style="margin: 0; color: #888; font-size: 12px;">
      WM Property Management<br>
      Sistema de Gestión de Propiedades
    </p>
  </div>
</body>
</html>
  `;
}

serve(handler);
