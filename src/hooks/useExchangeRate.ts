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
      setRate(1450); // Fallback
      setSource('default');
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const targetDate = options.date || new Date().toISOString().split('T')[0];
    const sourceType = options.sourceType || 'oficial'; // Default a oficial
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
        // Fallback a valor por defecto
        console.warn('No exchange rate found, using default value');
        setRate(1450);
        setSource('default');
      }
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
      setRate(1450);
      setSource('default');
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
