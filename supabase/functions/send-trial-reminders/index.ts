import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Get trials expiring in 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: expiringTrials, error } = await supabase
      .from('tenant_subscriptions')
      .select(`
        id,
        tenant_id,
        trial_end,
        billing_cycle,
        pms_tenants!inner(name),
        subscription_invoices!inner(
          amount,
          due_date,
          status
        )
      `)
      .eq('status', 'trial')
      .lte('trial_end', sevenDaysFromNow.toISOString())
      .gte('trial_end', new Date().toISOString());

    if (error) throw error;

    console.log(`Found ${expiringTrials?.length || 0} trials expiring soon`);

    // Send reminder emails
    for (const subscription of expiringTrials || []) {
      const invoice = (subscription as any).subscription_invoices[0];
      if (!invoice || invoice.status !== 'pending') continue;

      // Get user email
      const { data: userRole } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          users!inner(email, first_name)
        `)
        .eq('tenant_id', subscription.tenant_id)
        .eq('module', 'PMS')
        .limit(1)
        .single();

      if (!userRole) continue;

      const user = (userRole as any).users;
      const daysRemaining = Math.ceil(
        (new Date(subscription.trial_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      try {
        await resend.emails.send({
          from: "WM Property Management <onboarding@resend.dev>",
          to: [user.email],
          subject: `⏰ Tu período de prueba finaliza en ${daysRemaining} días - WM PMS`,
          html: `... (email HTML content) ...`
        });

        console.log(`Sent reminder to ${user.email} for trial ending in ${daysRemaining} days`);
      } catch (emailError) {
        console.error(`Error sending email to ${user.email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: expiringTrials?.length || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-trial-reminders:", error);
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
