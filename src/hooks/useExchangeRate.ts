import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePMS } from '@/contexts/PMSContext';

interface ExchangeRateOptions {
  date?: string; // ISO format YYYY-MM-DD
  sourceType?: 'oficial' | 'blue' | 'mep';
  preferredType?: 'sell' | 'buy';
}

interface ExchangeRateResult {
  rate: number | null;
  loading: boolean;
  source: string;
  refresh: () => void;
}

export function useExchangeRate(options: ExchangeRateOptions = {}): ExchangeRateResult {
  const { currentTenant } = usePMS();
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');

  const fetchExchangeRate = async () => {
    if (!currentTenant?.id) {
      setRate(null);
      setSource('no-tenant');
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const targetDate = options.date || new Date().toISOString().split('T')[0];
    const sourceType = options.sourceType || 'oficial';
    const preferredType = options.preferredType || 'sell';

    try {
      // Buscar tipo de cambio exacto para la fecha
      let { data, error } = await supabase
        .from('pms_exchange_rates')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('date', targetDate)
        .eq('source_type', sourceType)
        .maybeSingle();

      // Si no existe para esa fecha, buscar el más reciente anterior
      if (!data) {
        const { data: recentData } = await supabase
          .from('pms_exchange_rates')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .eq('source_type', sourceType)
          .lte('date', targetDate)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        data = recentData;
      }

      if (data) {
        const rateValue = preferredType === 'sell' ? data.sell_rate : data.buy_rate;
        setRate(Number(rateValue));
        setSource(`${data.source_type} (${data.date})`);
      } else {
        // No hay datos - intentar llamar API directamente como fallback
        console.warn('No exchange rate found in DB, calling API directly');
        try {
          const apiUrl = sourceType === 'blue' 
            ? 'https://dolarapi.com/v1/dolares/blue'
            : sourceType === 'mep'
            ? 'https://dolarapi.com/v1/dolares/bolsa'
            : 'https://dolarapi.com/v1/dolares/oficial';
          
          const response = await fetch(apiUrl);
          const apiData = await response.json();
          
          if (apiData && apiData.venta) {
            const rateValue = preferredType === 'sell' ? apiData.venta : apiData.compra;
            setRate(Number(rateValue));
            setSource(`API ${sourceType} (${new Date().toISOString().split('T')[0]})`);
          } else {
            setRate(null);
            setSource('no-data');
          }
        } catch (apiError) {
          console.error('Error fetching from API:', apiError);
          setRate(null);
          setSource('error');
        }
      }
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
      setRate(null);
      setSource('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
  }, [currentTenant?.id, options.date, options.sourceType]);

  return { 
    rate, 
    loading, 
    source,
    refresh: fetchExchangeRate 
  };
}
