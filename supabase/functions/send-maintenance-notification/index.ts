import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  action: 'created' | 'assigned' | 'updated' | 'completed';
  maintenance_title: string;
  property_address: string;
  property_code?: string;
  reporter_email?: string;
  assignee_email?: string;
  assignee_name?: string;
  priority: string;
  description: string;
  category?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      action, 
      maintenance_title, 
      property_address,
      property_code,
      assignee_email, 
      assignee_name,
      reporter_email,
      priority,
      description,
      category 
    }: NotificationRequest = await req.json();

    console.log("Sending maintenance notification:", { action, maintenance_title, assignee_email, reporter_email });

    // Email al asignado cuando se crea o asigna una solicitud
    if ((action === 'created' || action === 'assigned') && assignee_email) {
      const priorityEmoji = priority === 'alta' ? '🔴' : priority === 'media' ? '🟡' : '🟢';
      
      const emailResponse = await resend.emails.send({
        from: "WM Propiedades <onboarding@resend.dev>",
        to: [assignee_email],
        subject: `🔧 Nueva Solicitud de Mantenimiento - ${maintenance_title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Nueva solicitud de mantenimiento asignada</h2>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Propiedad:</strong> ${property_code ? `${property_code} - ` : ''}${property_address}</p>
              <p style="margin: 10px 0;"><strong>Título:</strong> ${maintenance_title}</p>
              <p style="margin: 10px 0;"><strong>Prioridad:</strong> ${priorityEmoji} ${priority.charAt(0).toUpperCase() + priority.slice(1)}</p>
              ${category ? `<p style="margin: 10px 0;"><strong>Categoría:</strong> ${category}</p>` : ''}
              <p style="margin: 10px 0;"><strong>Descripción:</strong> ${description}</p>
            </div>

            <p>Hola ${assignee_name || 'equipo'},</p>
            <p>Se te ha asignado una nueva solicitud de mantenimiento. Por favor, accede al sistema PMS para ver los detalles completos y gestionar esta solicitud.</p>
            
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              Este es un email automático del sistema WM Propiedades. Por favor, no responder a este correo.
            </p>
          </div>
        `,
      });

      console.log("Email sent to assignee:", emailResponse);
    }

    // Email al reportante cuando se completa la solicitud
    if (action === 'completed' && reporter_email) {
      const emailResponse = await resend.emails.send({
        from: "WM Propiedades <onboarding@resend.dev>",
        to: [reporter_email],
        subject: `✅ Solicitud de Mantenimiento Completada - ${maintenance_title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">✅ Solicitud completada</h2>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 10px 0;"><strong>Propiedad:</strong> ${property_code ? `${property_code} - ` : ''}${property_address}</p>
              <p style="margin: 10px 0;"><strong>Título:</strong> ${maintenance_title}</p>
              ${category ? `<p style="margin: 10px 0;"><strong>Categoría:</strong> ${category}</p>` : ''}
            </div>

            <p>Tu solicitud de mantenimiento ha sido completada exitosamente.</p>
            <p>Puedes revisar los detalles y el historial completo en el sistema PMS.</p>
            
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              Este es un email automático del sistema WM Propiedades. Por favor, no responder a este correo.
            </p>
          </div>
        `,
      });

      console.log("Email sent to reporter:", emailResponse);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-maintenance-notification:", error);
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
