import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceResult {
  created: number;
  skipped: number;
  errors: string[];
  invoices: Array<{
    tenant_name: string;
    invoice_number: string;
    amount: number;
    due_date: string;
    email?: string;
  }>;
}

async function sendInvoiceNotification(
  resend: Resend,
  email: string,
  tenantName: string,
  invoiceNumber: string,
  amount: number,
  currency: string,
  dueDate: string,
  billingPeriodStart: string,
  billingPeriodEnd: string
) {
  try {
    const formattedAmount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
    }).format(amount);

    const formattedDueDate = new Date(dueDate).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedPeriodStart = new Date(billingPeriodStart).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedPeriodEnd = new Date(billingPeriodEnd).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    await resend.emails.send({
      from: 'Granada WM <notificaciones@granadawm.com>',
      to: [email],
      subject: `Nueva factura generada - ${invoiceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .amount { font-size: 24px; color: #1e3a5f; font-weight: bold; }
            .due-date { color: #d97706; font-weight: bold; }
            .cta-button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nueva Factura Generada</h1>
              <p>Granada Wealth Management</p>
            </div>
            <div class="content">
              <p>Estimado/a cliente de <strong>${tenantName}</strong>,</p>
              <p>Se ha generado una nueva factura para su suscripción:</p>
              
              <div class="invoice-details">
                <div class="detail-row">
                  <span>Número de factura:</span>
                  <strong>${invoiceNumber}</strong>
                </div>
                <div class="detail-row">
                  <span>Período de facturación:</span>
                  <span>${formattedPeriodStart} - ${formattedPeriodEnd}</span>
                </div>
                <div class="detail-row">
                  <span>Fecha de vencimiento:</span>
                  <span class="due-date">${formattedDueDate}</span>
                </div>
                <div class="detail-row">
                  <span>Monto a pagar:</span>
                  <span class="amount">${formattedAmount}</span>
                </div>
              </div>
              
              <p>Por favor, realice el pago antes de la fecha de vencimiento para mantener su suscripción activa.</p>
              
              <p>Si tiene alguna consulta, no dude en contactarnos.</p>
              
              <div class="footer">
                <p>Este es un correo automático. Por favor no responda a este mensaje.</p>
                <p>© ${new Date().getFullYear()} Granada Wealth Management. Todos los derechos reservados.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`📧 Email de factura enviado a ${email} para ${tenantName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error enviando email a ${email}:`, error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    console.log('📄 Generando facturas de renovación...');

    // Llamar a la función RPC
    const { data, error } = await supabase.rpc('generate_renewal_invoices');

    if (error) {
      console.error('❌ Error en generate_renewal_invoices:', error);
      throw error;
    }

    console.log('✅ Facturas generadas:', data);

    const result: InvoiceResult = {
      created: data?.created || 0,
      skipped: data?.skipped || 0,
      errors: [],
      invoices: [],
    };

    // Si se generaron facturas, obtener detalles y enviar emails
    if (result.created > 0 && resend) {
      console.log(`📧 Preparando envío de ${result.created} notificaciones...`);

      // Obtener las facturas recién generadas (las de hoy)
      const today = new Date().toISOString().split('T')[0];
      
      const { data: invoices, error: invoicesError } = await supabase
        .from('subscription_invoices')
        .select(`
          id,
          invoice_number,
          amount,
          currency,
          due_date,
          billing_period_start,
          billing_period_end,
          tenant_id,
          pms_tenants!inner (
            name,
            email
          )
        `)
        .gte('created_at', `${today}T00:00:00`)
        .eq('status', 'pending');

      if (invoicesError) {
        console.error('❌ Error obteniendo facturas:', invoicesError);
        result.errors.push(`Error obteniendo facturas: ${invoicesError.message}`);
      } else if (invoices && invoices.length > 0) {
        for (const invoice of invoices) {
          const tenant = invoice.pms_tenants as any;
          const tenantName = tenant?.name || 'Cliente';
          const tenantEmail = tenant?.email;

          result.invoices.push({
            tenant_name: tenantName,
            invoice_number: invoice.invoice_number,
            amount: invoice.amount,
            due_date: invoice.due_date,
            email: tenantEmail,
          });

          if (tenantEmail) {
            const emailSent = await sendInvoiceNotification(
              resend,
              tenantEmail,
              tenantName,
              invoice.invoice_number,
              invoice.amount,
              invoice.currency,
              invoice.due_date,
              invoice.billing_period_start,
              invoice.billing_period_end
            );

            if (!emailSent) {
              result.errors.push(`Error enviando email a ${tenantEmail}`);
            }
          } else {
            console.warn(`⚠️ Tenant ${tenantName} no tiene email configurado`);
            result.errors.push(`Tenant ${tenantName} sin email`);
          }
        }
      }
    } else if (result.created > 0 && !resend) {
      console.warn('⚠️ RESEND_API_KEY no configurado, no se enviarán emails');
      result.errors.push('RESEND_API_KEY no configurado');
    }

    console.log('📊 Resultado final:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
