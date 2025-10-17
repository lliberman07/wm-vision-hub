import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // FUNCIÓN DEPRECADA - ya no se permite regenerar calendarios manualmente
    console.warn('Intento de usar función deprecada: regenerate-schedule-items');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Esta función ha sido deprecada. Los calendarios de pago se actualizan automáticamente cuando se modifican contratos o índices económicos.',
        deprecated: true,
        message: 'No se permite regenerar calendarios manualmente para evitar duplicaciones de datos.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 410, // Gone
      }
    );
  } catch (error) {
    console.error('Error in regenerate-schedule-items function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
