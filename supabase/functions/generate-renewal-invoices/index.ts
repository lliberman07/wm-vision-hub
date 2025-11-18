import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📄 Generando facturas de renovación...');

    // Llamar a la función RPC
    const { data, error } = await supabase.rpc('generate_renewal_invoices');

    if (error) {
      console.error('❌ Error en generate_renewal_invoices:', error);
      throw error;
    }

    console.log('✅ Facturas generadas:', data);

    // TODO: Enviar emails con las facturas generadas
    if (data.created > 0) {
      console.log(`📧 ${data.created} facturas generadas y listas para enviar`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...data,
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
