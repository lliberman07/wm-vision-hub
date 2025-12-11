import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RenewalRequest {
  subscription_id: string;
  new_billing_cycle: 'monthly' | 'yearly';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { subscription_id, new_billing_cycle }: RenewalRequest = await req.json();

    if (!subscription_id || !new_billing_cycle) {
      return new Response(
        JSON.stringify({ error: 'subscription_id and new_billing_cycle are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing renewal for subscription ${subscription_id} with billing cycle ${new_billing_cycle}`);

    // Get the current subscription
    const { data: subscription, error: subError } = await supabase
      .from('tenant_subscriptions')
      .select(`
        *,
        subscription_plans (
          id,
          name,
          price_monthly,
          price_yearly,
          currency
        ),
        pms_tenants (
          id,
          name,
          email
        )
      `)
      .eq('id', subscription_id)
      .single();

    if (subError || !subscription) {
      console.error('Subscription not found:', subError);
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify renewal is required
    if (!subscription.renewal_required) {
      return new Response(
        JSON.stringify({ error: 'Esta suscripción no requiere renovación' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const newPeriodStart = new Date(subscription.current_period_end);
    newPeriodStart.setDate(newPeriodStart.getDate() + 1);
    
    let newPeriodEnd: Date;
    let invoiceAmount: number;
    let invoiceNotes: string;
    
    if (new_billing_cycle === 'yearly') {
      // Annual payment: 1 year period, single invoice
      newPeriodEnd = new Date(newPeriodStart);
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      newPeriodEnd.setDate(newPeriodEnd.getDate() - 1);
      invoiceAmount = subscription.subscription_plans.price_yearly;
      invoiceNotes = `Renovación Anual - Plan ${subscription.subscription_plans.name} (12 meses)`;
    } else {
      // Monthly payment: 1 month period, first of 12 invoices
      newPeriodEnd = new Date(newPeriodStart);
      newPeriodEnd.setDate(newPeriodEnd.getDate() + 29); // 30 days total
      invoiceAmount = subscription.subscription_plans.price_monthly;
      invoiceNotes = `Renovación - Factura 1 de 12 - Plan ${subscription.subscription_plans.name} (Mensual)`;
    }

    // Generate invoice number
    const invoiceNumber = `INV-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${
      Math.random().toString(36).substring(2, 10).toUpperCase()
    }`;

    // Create the renewal invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('subscription_invoices')
      .insert({
        subscription_id: subscription.id,
        tenant_id: subscription.tenant_id,
        invoice_number: invoiceNumber,
        invoice_type: 'renewal',
        amount: invoiceAmount,
        currency: subscription.subscription_plans.currency || 'ARS',
        status: 'pending',
        issue_date: now.toISOString().split('T')[0],
        due_date: newPeriodStart.toISOString().split('T')[0],
        billing_period_start: newPeriodStart.toISOString().split('T')[0],
        billing_period_end: newPeriodEnd.toISOString().split('T')[0],
        notes: invoiceNotes
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw invoiceError;
    }

    console.log(`Created renewal invoice ${invoiceNumber}`);

    // Update the subscription
    const { error: updateError } = await supabase
      .from('tenant_subscriptions')
      .update({
        billing_cycle: new_billing_cycle,
        contract_start_date: newPeriodStart.toISOString().split('T')[0],
        contract_invoice_count: new_billing_cycle === 'yearly' ? 1 : 1, // Reset to 1 (first invoice created)
        renewal_required: false,
        current_period_start: newPeriodStart.toISOString().split('T')[0],
        current_period_end: newPeriodEnd.toISOString().split('T')[0],
        updated_at: now.toISOString()
      })
      .eq('id', subscription_id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      throw updateError;
    }

    console.log(`Updated subscription ${subscription_id} for renewal`);

    // Send email notification if Resend is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey && subscription.pms_tenants?.email) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Granada <no-reply@granadawm.com>',
            to: [subscription.pms_tenants.email],
            subject: `Renovación Confirmada - ${subscription.subscription_plans.name}`,
            html: `
              <h2>¡Renovación de Suscripción Confirmada!</h2>
              <p>Hola ${subscription.pms_tenants.name},</p>
              <p>Tu suscripción ha sido renovada exitosamente.</p>
              
              <h3>Detalles de la Renovación:</h3>
              <ul>
                <li><strong>Plan:</strong> ${subscription.subscription_plans.name}</li>
                <li><strong>Tipo de pago:</strong> ${new_billing_cycle === 'yearly' ? 'Anual' : 'Mensual'}</li>
                <li><strong>Nuevo período:</strong> ${newPeriodStart.toLocaleDateString('es-AR')} - ${newPeriodEnd.toLocaleDateString('es-AR')}</li>
              </ul>
              
              <h3>Factura Generada:</h3>
              <ul>
                <li><strong>Número:</strong> ${invoiceNumber}</li>
                <li><strong>Monto:</strong> $${invoiceAmount.toLocaleString('es-AR')} ${subscription.subscription_plans.currency || 'ARS'}</li>
                <li><strong>Vencimiento:</strong> ${newPeriodStart.toLocaleDateString('es-AR')}</li>
              </ul>
              
              <p>Ingresa a tu panel para subir el comprobante de pago.</p>
              
              <p>Gracias por continuar confiando en nosotros.</p>
              <p>El equipo de Granada</p>
            `,
          }),
        });

        if (!emailRes.ok) {
          console.error('Error sending email:', await emailRes.text());
        } else {
          console.log('Renewal confirmation email sent');
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Suscripción renovada exitosamente',
        subscription_id,
        new_billing_cycle,
        invoice_id: invoice.id,
        invoice_number: invoiceNumber,
        new_period_start: newPeriodStart.toISOString().split('T')[0],
        new_period_end: newPeriodEnd.toISOString().split('T')[0],
        amount: invoiceAmount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing renewal:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error al procesar la renovación' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
