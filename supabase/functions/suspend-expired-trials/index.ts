import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get trial subscriptions that have expired
    const { data: expiredTrials, error: trialsError } = await supabase
      .from('tenant_subscriptions')
      .select(`
        id,
        tenant_id,
        trial_end,
        pms_tenants!inner(name)
      `)
      .eq('status', 'trial')
      .lt('trial_end', new Date().toISOString());

    if (trialsError) throw trialsError;

    console.log(`Found ${expiredTrials?.length || 0} expired trial subscriptions`);

    // Suspend each expired trial
    for (const subscription of expiredTrials || []) {
      // Check if there's a paid invoice
      const { data: paidInvoice } = await supabase
        .from('subscription_invoices')
        .select('id')
        .eq('subscription_id', subscription.id)
        .eq('status', 'paid')
        .limit(1)
        .single();

      // Only suspend if no payment has been made
      if (!paidInvoice) {
        const { error: updateError } = await supabase
          .from('tenant_subscriptions')
          .update({ status: 'suspended' })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`Error suspending subscription ${subscription.id}:`, updateError);
        } else {
          console.log(`Suspended subscription ${subscription.id} for tenant ${(subscription as any).pms_tenants.name}`);
        }
      }
    }

    // Update overdue invoices
    const { data: overdueInvoices, error: overdueError } = await supabase
      .from('subscription_invoices')
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())
      .select();

    if (overdueError) throw overdueError;

    console.log(`Marked ${overdueInvoices?.length || 0} invoices as overdue`);

    return new Response(
      JSON.stringify({
        success: true,
        suspended_count: expiredTrials?.length || 0,
        overdue_count: overdueInvoices?.length || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in suspend-expired-trials:", error);
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
