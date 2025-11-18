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

    console.log('🔄 Ejecutando conversión de trials expirados...');

    // Llamar a la función RPC
    const { data, error } = await supabase.rpc('convert_expired_trials');

    if (error) {
      console.error('❌ Error en convert_expired_trials:', error);
      throw error;
    }

    console.log('✅ Conversión completada:', data);

    // Enviar emails de notificación a los que fueron convertidos
    if (data.converted_to_active > 0 || data.suspended > 0) {
      // TODO: Implementar envío de emails de bienvenida/suspensión
      console.log(`📧 ${data.converted_to_active} suscripciones activadas, ${data.suspended} suspendidas`);
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
