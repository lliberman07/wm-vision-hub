import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CreditType } from '@/types/credit';

export const useUVADetection = (creditType: CreditType) => {
  const [hasUVAProducts, setHasUVAProducts] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectUVAProducts = async () => {
      setLoading(true);
      try {
        const tableName = creditType === 'hipotecario' 
          ? 'creditos_hipotecarios'
          : creditType === 'personal'
          ? 'creditos_personales'
          : 'creditos_prendarios';

        const { data, error } = await supabase
          .from(tableName)
          .select('id')
          .ilike('denominacion', '%UVA%')
          .limit(1);

        if (error) throw error;
        setHasUVAProducts(data && data.length > 0);
      } catch (error) {
        console.error('Error detecting UVA products:', error);
        setHasUVAProducts(false);
      } finally {
        setLoading(false);
      }
    };

    detectUVAProducts();
  }, [creditType]);

  return { hasUVAProducts, loading };
};
