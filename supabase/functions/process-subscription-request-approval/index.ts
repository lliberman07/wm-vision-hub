import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  request_id: string;
  action: 'approve' | 'reject';
  review_notes?: string;
  rejection_reason?: string;
  activation_type?: 'trial' | 'direct' | 'scheduled';
  trial_days?: number;
  activation_date?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get auth user from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    // Verify user is Granada admin
    const { data: granadaUser, error: granadaError } = await supabaseAdmin
      .from("granada_platform_users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (granadaError || !granadaUser) {
      throw new Error("User is not a Granada admin");
    }

    const { 
      request_id, 
      action, 
      review_notes, 
      rejection_reason,
      activation_type = 'direct',
      trial_days = 14,
      activation_date
    }: ApprovalRequest = await req.json();

    console.log(`Processing ${action} for request ${request_id}`);

    // Get the request
    const { data: request, error: requestError } = await supabaseAdmin
      .from("subscription_requests")
      .select("*, requested_plan_id(*)")
      .eq("id", request_id)
      .single();

    if (requestError || !request) {
      throw new Error("Request not found");
    }

    if (request.status !== 'pending' && request.status !== 'in_review') {
      throw new Error("Request has already been processed");
    }

    if (action === 'reject') {
      // Reject the request
      const { error: updateError } = await supabaseAdmin
        .from("subscription_requests")
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes,
          rejection_reason
        })
        .eq("id", request_id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, action: 'rejected' }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // APPROVE: Create tenant, user, and subscription
    console.log("Creating tenant and user for approved request");

    // 1. Generate tenant slug
    const baseSlug = request.company_name 
      ? request.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-')
      : `${request.first_name}-${request.last_name}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const tenantSlug = `${baseSlug}-${randomSuffix}`;

    // 2. Create tenant
    const { data: newTenant, error: tenantError } = await supabaseAdmin
      .from("pms_tenants")
      .insert({
        name: request.company_name || `${request.first_name} ${request.last_name}`,
        slug: tenantSlug,
        tenant_type: request.applicant_type === 'propietario' ? 'propietario' : 'inmobiliaria',
        admin_email: request.email,
        is_active: false, // Will be activated after payment
        settings: {
          contact_info: {
            email: request.email,
            phone: request.phone,
            country: request.country,
            province: request.province,
            city: request.city,
            cuit_cuil: request.cuit_cuil,
            neighborhood: request.neighborhood
          },
          onboarding: {
            estimated_properties: request.estimated_properties,
            current_system: request.current_system,
            subscription_request_id: request_id
          }
        }
      })
      .select()
      .single();

    if (tenantError || !newTenant) {
      console.error("Error creating tenant:", tenantError);
      throw new Error("Failed to create tenant: " + tenantError?.message);
    }

    console.log("Tenant created:", newTenant.id);

    // 3. Check if user already exists or create new one
    let authUserId: string;
    let tempPassword = '';
    let isNewUser = false;

    // For this project we don't reliably search auth by email here
    // We will attempt to create the user, and if Supabase returns
    // email_exists we handle it in the error branch below.
    const existingUser = null;

    if (existingUser) {
      console.log("User already exists, using existing user:", existingUser.id);
      authUserId = existingUser.id;
      
      // Check if this user is already assigned to another tenant
      const { data: existingClientUser } = await supabaseAdmin
        .from("pms_client_users")
        .select("tenant_id")
        .eq("user_id", existingUser.id)
        .single();
      
      if (existingClientUser && existingClientUser.tenant_id !== newTenant.id) {
        // Rollback tenant
        await supabaseAdmin.from("pms_tenants").delete().eq("id", newTenant.id);
        throw new Error(`Este email ya está registrado en otra cuenta. Por favor contacte al usuario o use otro email.`);
      }
    } else {
      // Create new auth user
      tempPassword = crypto.randomUUID().substring(0, 12);
      isNewUser = true;
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: request.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: request.first_name,
          last_name: request.last_name,
          entity_type: request.company_name ? 'empresa' : 'persona',
          company_name: request.company_name,
        }
      });

      if (authError || !authData.user) {
        const authErr: any = authError;
        // If email already exists in Supabase Auth, rollback and return
        // a controlled response so the frontend can mostrar un mensaje claro
        if (authErr && authErr.code === 'email_exists') {
          console.error('Auth user already exists with this email, cannot create new one');
          await supabaseAdmin.from("pms_tenants").delete().eq("id", newTenant.id);

          return new Response(
            JSON.stringify({
              success: false,
              code: 'EMAIL_ALREADY_REGISTERED',
              message: 'Este email ya está registrado en otra cuenta. Por favor use otro email para el administrador.'
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        console.error("Error creating auth user:", authError);
        // Rollback tenant
        await supabaseAdmin.from("pms_tenants").delete().eq("id", newTenant.id);
        throw new Error("Failed to create user account: " + authError?.message);
      }

      authUserId = authData.user.id;
      console.log("New auth user created:", authUserId);
    }

    // 4. Create or update CLIENT_ADMIN record
    const { data: existingClientUser } = await supabaseAdmin
      .from("pms_client_users")
      .select("*")
      .eq("user_id", authUserId)
      .eq("tenant_id", newTenant.id)
      .single();

    if (!existingClientUser) {
      const { error: clientUserError } = await supabaseAdmin
        .from("pms_client_users")
        .insert({
          user_id: authUserId,
          tenant_id: newTenant.id,
          user_type: 'CLIENT_ADMIN',
          email: request.email,
          first_name: request.first_name,
          last_name: request.last_name,
          phone: request.phone,
          cuit_cuil: request.cuit_cuil,
          is_active: true,
          created_by: user.id,
        });

      if (clientUserError) {
        console.error("Error creating client user:", clientUserError);
        // Rollback only if we created a new user
        if (isNewUser) {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
        }
        await supabaseAdmin.from("pms_tenants").delete().eq("id", newTenant.id);
        throw new Error("Failed to create client user: " + clientUserError.message);
      }

      console.log("Client user created");
    } else {
      console.log("Client user already exists, using existing record");
    }

    // 5. Calculate subscription dates
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let subscriptionStatus = 'active';

    if (activation_type === 'trial') {
      endDate = new Date(now.getTime() + trial_days * 24 * 60 * 60 * 1000);
      subscriptionStatus = 'trial';
    } else if (activation_type === 'scheduled' && activation_date) {
      startDate = new Date(activation_date);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (request.billing_cycle === 'annual' ? 12 : 1));
      subscriptionStatus = 'pending';
    } else {
      // Direct activation
      endDate.setMonth(endDate.getMonth() + (request.billing_cycle === 'annual' ? 12 : 1));
    }

    // 6. Create subscription
    const { data: newSubscription, error: subscriptionError } = await supabaseAdmin
      .from("tenant_subscriptions")
      .insert({
        tenant_id: newTenant.id,
        plan_id: request.requested_plan_id,
        status: subscriptionStatus,
        billing_cycle: request.billing_cycle,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_trial: activation_type === 'trial',
        auto_renew: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (subscriptionError || !newSubscription) {
      console.error("Error creating subscription:", subscriptionError);
      // Rollback
      if (isNewUser && authUserId) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
      }
      await supabaseAdmin.from("pms_client_users").delete().eq("user_id", authUserId);
      await supabaseAdmin.from("pms_tenants").delete().eq("id", newTenant.id);
      throw new Error("Failed to create subscription: " + subscriptionError?.message);
    }

    console.log("Subscription created:", newSubscription.id);

    // 7. Create initial invoice if not trial
    if (activation_type !== 'trial') {
      const { data: plan } = await supabaseAdmin
        .from("subscription_plans")
        .select("*")
        .eq("id", request.requested_plan_id)
        .single();

      if (plan) {
        const amount = request.billing_cycle === 'annual' 
          ? plan.annual_price 
          : plan.monthly_price;

        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + 7); // 7 days to pay

        const invoiceNumber = `INV-${newTenant.id.substring(0, 8).toUpperCase()}-${Date.now()}`;

        await supabaseAdmin
          .from("subscription_invoices")
          .insert({
            tenant_id: newTenant.id,
            subscription_id: newSubscription.id,
            invoice_number: invoiceNumber,
            amount: amount,
            subtotal: amount,
            total_amount: amount,
            currency: plan.currency,
            status: 'pending',
            issue_date: startDate.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            billing_period_start: startDate.toISOString().split('T')[0],
            billing_period_end: endDate.toISOString().split('T')[0],
            created_by: user.id,
          });

        console.log("Invoice created");
      }
    }

    // 8. Update request
    const { error: updateError } = await supabaseAdmin
      .from("subscription_requests")
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes,
        created_tenant_id: newTenant.id,
        created_subscription_id: newSubscription.id,
      })
      .eq("id", request_id);

    if (updateError) {
      console.error("Error updating request:", updateError);
    }

    // 9. Send welcome email with credentials (only if new user)
    if (isNewUser && tempPassword) {
      try {
        await supabaseAdmin.functions.invoke('send-welcome-email', {
          body: {
            email: request.email,
            first_name: request.first_name,
            password: tempPassword,
          }
        });
        console.log("Welcome email sent");
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Don't fail the whole process if email fails
      }
    } else {
      console.log("Skipping welcome email - user already exists");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: 'approved',
        tenant_id: newTenant.id,
        subscription_id: newSubscription.id,
        tenant_slug: tenantSlug,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in process-subscription-request-approval:", error);
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
