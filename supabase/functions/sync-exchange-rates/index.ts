import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOLAR_API_BASE = "https://dolarapi.com/v1/dolares";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting exchange rates sync...');

    // Obtener cotizaciones de diferentes tipos
    const [oficialRes, blueRes, mepRes] = await Promise.all([
      fetch(`${DOLAR_API_BASE}/oficial`),
      fetch(`${DOLAR_API_BASE}/blue`),
      fetch(`${DOLAR_API_BASE}/bolsa`),
    ]);

    if (!oficialRes.ok || !blueRes.ok || !mepRes.ok) {
      throw new Error('Error fetching exchange rates from DolarAPI');
    }

    const [oficial, blue, mep] = await Promise.all([
      oficialRes.json(),
      blueRes.json(),
      mepRes.json(),
    ]);

    console.log('Exchange rates fetched:', { oficial, blue, mep });

    const today = new Date().toISOString().split('T')[0];

    // Obtener todos los tenants activos
    const { data: tenants, error: tenantsError } = await supabase
      .from('pms_tenants')
      .select('id')
      .eq('is_active', true);

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      throw tenantsError;
    }

    console.log(`Found ${tenants?.length || 0} active tenants`);

    // Insertar/actualizar para cada tenant
    const insertPromises = tenants?.flatMap(tenant => [
      {
        tenant_id: tenant.id,
        date: today,
        source_type: 'oficial',
        buy_rate: oficial.compra,
        sell_rate: oficial.venta,
        api_response: oficial,
        is_manual: false
      },
      {
        tenant_id: tenant.id,
        date: today,
        source_type: 'blue',
        buy_rate: blue.compra,
        sell_rate: blue.venta,
        api_response: blue,
        is_manual: false
      },
      {
        tenant_id: tenant.id,
        date: today,
        source_type: 'mep',
        buy_rate: mep.compra,
        sell_rate: mep.venta,
        api_response: mep,
        is_manual: false
      }
    ]) || [];

    console.log(`Upserting ${insertPromises.length} exchange rate records...`);

    const { error } = await supabase
      .from('pms_exchange_rates')
      .upsert(insertPromises, {
        onConflict: 'tenant_id,date,source_type'
      });

    if (error) {
      console.error('Error upserting exchange rates:', error);
      throw error;
    }

    console.log('Exchange rates sync completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${insertPromises.length} exchange rates for ${tenants?.length} tenants`,
        date: today,
        rates: {
          oficial: { compra: oficial.compra, venta: oficial.venta },
          blue: { compra: blue.compra, venta: blue.venta },
          mep: { compra: mep.compra, venta: mep.venta }
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error syncing exchange rates:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
